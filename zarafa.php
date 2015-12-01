<?php
	/**
	* This file is the dispatcher of the whole application, every request for data enters
	* here. XML is received and send to the client.
	*/

	// Include files
	require_once("init.php");
	require_once("config.php");
	// Load json class, so json_encode is avaliable for PHP < 5.3
	require_once("server/core/class.json.php");
	require_once("defaults.php");
	require_once("server/util.php");
	require_once("server/gettext.php");

	require_once("mapi/mapi.util.php");
	require_once("mapi/mapicode.php");
	require_once("mapi/mapidefs.php");
	require_once("mapi/mapitags.php");
	require_once("mapi/mapiguid.php");
	require_once("mapi/class.baseexception.php");
	require_once("mapi/class.mapiexception.php");

	require_once("server/exceptions/class.ZarafaException.php");
	require_once("server/exceptions/class.ZarafaErrorException.php");
	require_once("server/core/class.conversion.php");
	require_once("server/core/class.mapisession.php");
	require_once("server/core/class.entryid.php");

	require_once("server/core/constants.php");

	require_once("server/core/class.webappsession.php");
	require_once("server/core/class.state.php");
	require_once("server/core/class.attachmentstate.php");
	require_once("server/core/class.jsonrequest.php");
	require_once("server/notifiers/class.notifier.php");
	require_once("server/modules/class.module.php");
	require_once("server/modules/class.listmodule.php");
	require_once("server/modules/class.itemmodule.php");
	require_once("server/core/class.dispatcher.php");
	require_once("server/core/class.operations.php");
	require_once("server/core/class.properties.php");
	require_once("server/core/class.bus.php");
	require_once("server/core/class.settings.php");
	require_once("server/core/class.language.php");
	require_once("server/core/class.pluginmanager.php");
	require_once("server/core/class.plugin.php");

	ob_start();
	setlocale(LC_CTYPE, "en_US.UTF-8");

	// Callback function for unserialize
	// Notifier objects of the previous request are stored in the session. With this
	// function they are restored to PHP objects.
	ini_set("unserialize_callback_func", "sessionNotifierLoader");
	
	$phpsession = WebAppSession::createInstance();

	// Create global mapi object. This object is used in many other files
	$GLOBALS["mapisession"] = new MAPISession(session_id());

	// We will only allow the logon when the sessionid in the GET arguments matches the
	// sessionid as send in the cookie. Otherwise the cookie was somehow modified in the
	// browser.
	$sessionid = sanitizeGetValue('sessionid', '', ID_REGEX);
	if ( $phpsession->hasTimedOut() ) {
		// Using a MAPI error code here, while it is not really a MAPI session timeout
		// However to the user this should make no difference, so the MAPI error will do.
		$hresult = MAPI_E_END_OF_SESSION;
	} elseif ($sessionid === $GLOBALS["mapisession"]->getSessionId()) {
		// Logon, the username and password are set in the "index.php" file. So whenever
		// an user enters this file, the username and password whould be set in the $_SESSION
		// variable
		if (isset($_SESSION["username"]) && isset($_SESSION["password"])) {
			$sslcert_file = defined('SSLCERT_FILE') ? SSLCERT_FILE : null;
			$sslcert_pass = defined('SSLCERT_PASS') ? SSLCERT_PASS : null;
			$hresult = $GLOBALS["mapisession"]->logon($_SESSION["username"], $_SESSION["password"], DEFAULT_SERVER, $sslcert_file, $sslcert_pass);
		} else {
			$hresult = MAPI_E_UNCONFIGURED;
		}
	} else {
		$hresult = MAPI_E_INVALID_WORKSTATION_ACCOUNT;
	}

	if (isset($_SESSION["lang"])) {
		$session_lang = $_SESSION["lang"];
	} else {
		$session_lang = LANG;
	}

	// Close the session now, so we're not blocking other clients
	session_write_close();

	// Set headers for JSON
	header("Content-Type: application/json; charset=utf-8");
	header("Expires: ".gmdate( "D, d M Y H:i:s")."GMT");
	header("Last-Modified: ".gmdate( "D, d M Y H:i:s")."GMT");
	header("Cache-Control: no-cache, must-revalidate");
	header("Pragma: no-cache");
	header("X-Zarafa: " . trim(file_get_contents('version')));

	if (isset($_GET['ping'])) {
		$pingTag = array(
			'info' => array(
				'hresult' => $hresult,
				'hresult_name' => get_mapi_error_name($hresult)
			)
		);

		switch ($hresult) {
			// A network error indicates that the connection
			// to the server could not be established.
			case MAPI_E_NETWORK_ERROR:
				$pingTag['success'] = false;
				break;
			// The following errors are specific to logging on,
			// it means the connection to the server did work,
			// but the user simply isn't logged in.
			case MAPI_E_PASSWORD_CHANGE_REQUIRED:
			case MAPI_E_PASSWORD_EXPIRED:
			case MAPI_E_INVALID_WORKSTATION_ACCOUNT:
			case MAPI_E_INVALID_ACCESS_TIME:
			case MAPI_E_ACCOUNT_DISABLED:
			// Error name says it all, connection exists, but cannot logon.
			case MAPI_E_LOGON_FAILED:
			// MAPI_E_UNCONFIGURED means we didn't try to connect to the server,
			// but the user is not logged in, so the state has changed for the user.
			case MAPI_E_UNCONFIGURED:
			// NOERROR means the logon was successfull, and the connection to the
			// server is working as expected.
			case NOERROR:
			// All other errors are considered a 'success' for connecting to the
			// server and the 'active' property will indicate if the user still
			// has an active session to the server.
			default:
				$pingTag['success'] = true;
				$pingTag['active'] = $GLOBALS["mapisession"]->isLoggedOn();
				break;
		}

		echo JSON::Encode($pingTag);
	} else if ($GLOBALS["mapisession"]->isLoggedOn()) {
		// Authenticated
		// Execute request

		// Instantiate Plugin Manager
		$GLOBALS['PluginManager'] = new PluginManager(ENABLE_PLUGINS);
		$GLOBALS['PluginManager']->detectPlugins(DISABLED_PLUGINS_LIST);
		$GLOBALS['PluginManager']->initPlugins(DEBUG_LOADER);

		// Create global dispatcher object
		$GLOBALS["dispatcher"] = new Dispatcher();
		// Create global operations object
		$GLOBALS["operations"] = new Operations();
		// Create global settings object
		$GLOBALS["settings"] = new Settings();

		// Create global language object
		$GLOBALS["language"] = new Language();
		// Set the correct language
		$GLOBALS["language"]->setLanguage($session_lang);

		// Get the state information for this subsystem
		$subsystem = sanitizeGetValue('subsystem', 'anonymous', ID_REGEX);

		$state = new State($subsystem);

		// Lock the state of this subsystem
		$state->open();

		// Get the bus object for this subsystem
		$bus = $state->read("bus");

		if(!$bus) {
			// Create global bus object
			$bus = new Bus();
		}

		// Make bus global
		$GLOBALS["bus"] = $bus;

		// Reset any spurious information in the bus state
		$GLOBALS["bus"]->reset();

		// Create global properties object
		$properties = $state->read("properties");

		if (!$properties) {
			$properties = new Properties();
		}
		$GLOBALS["properties"] = $properties;

		// Reset any spurious information in the properties state
		$GLOBALS["properties"]->reset();

		// Create new request object
		$request = new JSONRequest();

		// Get the XML from the client
		$xml = readData();

		if (DEBUG_XMLOUT) {
			dump_json($xml,"in"); // debugging
		}

		// Execute the request
		try {
			$xml = $request->execute($xml);
		} catch (Exception $e) {
			// invalid requestdata exception
			dump($e);
		}

		if (DEBUG_XMLOUT) {
			dump_json($xml,"out"); // debugging
		}

		// Check if we can use gzip compression
		if (ENABLE_RESPONSE_COMPRESSION && function_exists("gzencode") && isset($_SERVER["HTTP_ACCEPT_ENCODING"]) && strpos($_SERVER["HTTP_ACCEPT_ENCODING"], "gzip")!==false){
			// Set the correct header and compress the XML
			header("Content-Encoding: gzip");
			echo gzencode($xml);
		}else {
			echo $xml;
		}

		// Save the settings to the MAPI store
		$GLOBALS["settings"]->saveSettings();

		// Reset the BUS, and save it to the state file
		$GLOBALS["bus"]->reset();
		$state->write("bus", $GLOBALS["bus"], false);

		// Reset the properties and save it to the state file
		$GLOBALS["properties"]->reset();
		$state->write("properties", $GLOBALS["properties"], false);

		// Write all changes to disk
		$state->flush();

		// You can skip this as well because the lock is freed after the PHP script ends
		// anyway. (only for PHP < 5.3.2)
		$state->close();
	} else if ($hresult === MAPI_E_NETWORK_ERROR) {
		// The user is not logged in because the zarafa-server could not be reached.
		// Return a HTTP 503 error so the client can act upon this event correctly.
		header('HTTP/1.1 503 Service unavailable');
		header("X-Zarafa-Hresult: " . get_mapi_error_name($hresult));
	} else {
		// The session expired, or the user is otherwise not logged on.
		// Return a HTTP 401 error so the client can act upon this event correctly.
		header('HTTP/1.1 401 Unauthorized');
		header("X-Zarafa-Hresult: " . get_mapi_error_name($hresult));
	}
?>
