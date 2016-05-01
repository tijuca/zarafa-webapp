<?php
/**
 * Handle the upload request from the gui
 * Make sure to clear the cache after a upload! 
 */

define('BASE_PATH', __DIR__ . '/../../../');

// connect to the zarafa session
include(BASE_PATH . 'config.php');
session_name(COOKIE_NAME);
session_start();

ob_start();
include('version.php');
include('Files/class.helper.php');

require_once('Files/' . Helper::getSessionData("backend") . '_backend.php');

// Include the encryptionStore class
include(BASE_PATH . '/server/includes/core/class.encryptionstore.php');

$backend = Helper::getSessionData("backend") . "_backend";
$wdc = new $backend;
$wdc->set_server(Helper::getSessionData("server"));
$wdc->set_ssl(Helper::getSessionData("useSSL"));
$wdc->set_port(Helper::getSessionData("useSSL") == 1 ? Helper::getSessionData("portssl") : Helper::getSessionData("port"));
if(Helper::getSessionData("sessionAuth") == 1) {
	$encryptionStore = EncryptionStore::getInstance();
	$wdc->set_pass($encryptionStore->get('password'));
	$wdc->set_user($encryptionStore->get('username'));
} else {
	$wdc->set_pass(base64_decode(Helper::getSessionData("password")));
	$wdc->set_user(Helper::getSessionData("username"));
}
$wdc->set_base(Helper::getSessionData("path"));
$wdc->set_debug($_ENV["FP_PLUGIN_DEBUG"]);

try {
	$wdc->open();
} catch (BackendException $e) {
	echo json_encode(array ('success'=>false, 'response'=>$e->getCode(), 'message' => $e->getMessage()));
	exit;
}

$error = false;
$items = array();

for($i=0; $i < count($_FILES['attachments']['name']); $i++) {
	$targetpath = $_POST["parentID"] . $_FILES['attachments']['name'][$i];
	// upload the file
	try {
		$wdc->put_file($targetpath,$_FILES['attachments']['tmp_name'][$i]);
		$items[] = array ('tmp_name'=>$_FILES['attachments']['tmp_name'][$i], 'name'=>$_FILES['attachments']['name'][$i]);
	} catch (BackendException $e) {
		$error = $e;
		break;
	}	
}

ob_end_clean(); // in case you want to suppress output

if($error !== false) { // something went wrong...
	echo json_encode(array ('success'=>false, 'response'=>$error->getCode(), 'message' => $error->getMessage()));
} else {
	echo json_encode(array ('success'=>true, 'parent'=>$_POST["parentID"], 'items' => $items));
}

?>
