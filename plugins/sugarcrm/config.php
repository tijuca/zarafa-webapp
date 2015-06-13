<?php
/** Enable the sugarcrm plugin for all clients **/
define('PLUGIN_SUGARCRM_USER_DEFAULT_ENABLE', false);
/** Server accessable URL of the remote server **/
define('PLUGIN_SUGARCRM_SERVER_URL', "http://127.0.0.1/sugarcrm");
/** administrative username **/
define('PLUGIN_SUGARCRM_USERNAME', "admin");
/** administrative password **/
define('PLUGIN_SUGARCRM_PASSWORD', "admin");
/** the authentication class (subclass from DefaultAuthentication) -> must be loaded in the manifest.xml! **/
define('PLUGIN_SUGARCRM_AUTH_CLASS', "SugarCRMAuthentication");
/** target URL to POST the RFC822 concatinated with the default URL **/
define('PLUGIN_SUGARCRM_ARCHIVE_URI', "module=ZMerge&action=archiveMail");
/** default 10 minutes **/
define('PLUGIN_SUGARCRM_SESSION_TIMEOUT', 60 * 10);
?>
