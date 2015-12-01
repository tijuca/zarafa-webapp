<?php

//Includes. Will probably already be included.
include_once(dirname(__FILE__) . '/../../config.php');
include_once(dirname(__FILE__) . '/../../defaults.php');
include_once(dirname(__FILE__) . '/../util.php');
require_once(dirname(__FILE__) . '/class.json.php');
 
/**
 * A class with helper functions for the PHP session
 * @singleton
 */
class WebAppSession
{
	// Holds the instance of this class
	// Use public static method createInstance() to retrieve its value
	private static $instance = null;
	
	// Set to true when the the session has timed out
	// Use public method hasTimedOut() to retrieve its value
	private $timeout = false;
	 
	/**
	 * Constructor
	 */
	private function __construct(){
		if ( defined('COOKIE_NAME') )
		{
			//Create a named session (otherwise use the PHP default, normally PHPSESSID)
			session_name(COOKIE_NAME);
		}
		
		// @FIXME: This introduces a security vulnerability.
		// The sessionid should not be available to the client side JavaScript
		// and should never be sent as a POST variable.
		// So this code should be removed
		if ( $_POST && defined('COOKIE_NAME') && array_key_exists(COOKIE_NAME, $_POST) ){
			session_id($_POST[COOKIE_NAME]);
		}
		
		// Start the session so we can use it for timeout checking
		$this->start();
		
		if ( basename($_SERVER['PHP_SELF']) != 'zarafa.php' ){
			//We will only check for timeout in the zarafa.php page
			$this->setStartTime();
		}else{
			$this->checkForTimeout();
		}
	}
	
	/**
	 * returns the instance of this class. Creates one if it doesn't exist yet.
	 * To force this class to be used as singleton, the constructor is private
	 * and the single instance can be created/retrieved with this static method
	 * e.g.: $session = WebAppSession::createInstance()
	 * 
	 * @return WebAppSession the only available instance of this class
	 */
	public static function createInstance()
	{
		if ( !isset(WebAppSession::$instance) ){
			WebAppSession::$instance = new WebAppSession();
		}
		return WebAppSession::$instance;
	}
	
	/**
	 * Starts the session
	 */
	public function start()
	{
		session_start();
	}
	
	/**
	 * Closes the session
	 */
	public function close()
	 {
	 	session_write_close();
	 }
	 
	/**
	 * Destroy the session
	 */
	public function destroy()
	{
		// Destroy the session cookie
		if (isset($_COOKIE[session_name()])) {
			setcookie(session_name(), '', time()-42000, '/');
		}

		// Destroy the session
		$_SESSION = array();
		session_destroy();
	}
	
	/**
	 * Sets the start time in the session to current timestamp. 
	 * This is used to logout the user when CLIENT_TIMEOUT has 
	 * been set in config.php
	 */
	public function setStartTime()
	{
		$_SESSION['starttime'] = time();
	}
	
	/**
	 * gets the start time from the session. This is used to logout the user 
	 * when CLIENT_TIMEOUT has been set in config.php
	 * 
	 * @return integer|false The starttime (timestamp) when set, false otherwise
	 */
	public function getStartTime()
	{
		if ( isset($_SESSION['starttime']) ){
			return $_SESSION['starttime'];
		}else{
			return false;
		}
	}
	
	/**
	 * Checks if the session should timeout and destroys the session if it should.
	 */
	private function checkForTimeout()
	{
		if ( !defined('CLIENT_TIMEOUT') || !CLIENT_TIMEOUT ){
			//Timeout was not set in configuration, so do nothing
			return;
		}
		
		$starttime = $this->getStartTime();
		// let's add 5 seconds to the CLIENT_TIMEOUT to handle possible latency
		if ( $starttime && (time()-$starttime > CLIENT_TIMEOUT+5) ){
			$this->destroy();
			$this->timeout = true;
		}else{
			try{
				// decode JSON data
				$requestJsonString = readData();
				$requestJson = JSON::Decode($requestJsonString, true);
			}catch(JSONException $e){
				// Invalid json sent with the request
				// Log the error and do nothing is best option
				dump($e->getDisplayMessage());
			}

			$isReminderlistRequest = $this->isReminderListRequest($requestJson);
			$isDestroySessionRequest = $this->isDestroySessionRequest($requestJson);
			
			if ( !$isReminderlistRequest && !$isDestroySessionRequest){
				//Set a new session start time
				$this->setStartTime();
			}elseif ( $isDestroySessionRequest ){
				// sessiondestroy is sent because of timeout at client side 
				$this->timeout = true;
				$this->destroy();
			}
		}
	}

	/**
	 * Checks if the current request is a destroysession request
	 * 
	 * @param array $requestJson The JSON that was sent as the current request
	 * @return boolean
	 */
	private function isDestroySessionRequest($requestJson)
	{
		$isDestroySession = false;

		if ( isset($requestJson) && isset($requestJson['zarafa']) ){
			if ( isset($requestJson['zarafa']['hierarchymodule']) ){
				foreach ( $requestJson['zarafa']['hierarchymodule'] as $requestId=>$action ){
					if ( isset($action) && isset($action['destroysession']) ){
						$isDestroySession = true;
					}
				}
			}
		}

		return $isDestroySession;
	}

	/**
	 * Checks if the current request is a reminderlist request
	 * 
	 * @param array $requestJson The JSON that was sent as the current request
	 * @return boolean
	 */
	private function isReminderListRequest($requestJson)
	{
		return isset($requestJson) && isset($requestJson['zarafa']) && isset($requestJson['zarafa']['reminderlistmodule']);
	}
	
	/**
	 * Returns true if the current session has timed out, false otherwise
	 * 
	 * @return boolean
	 */
	public function hasTimedOut()
	{
		return $this->timeout;
	}
}
