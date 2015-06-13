<?php
/** 
 * This enables/disables the WHOLE plugin.
 */
define('PLUGIN_FILES_USER_DEFAULT_ENABLE', false);

/** 
 * This enables the "Attach file from Files" part.
 */
define('PLUGIN_FILESATTACHMENT_USER_DEFAULT_ENABLE', false);

/** 
 * This enables the "Save attachment to Files" part.
 */
define('PLUGIN_FILESRCVATTACHMENT_USER_DEFAULT_ENABLE', false);

/** 
 * The Files WebDav browser 
 */
define('PLUGIN_FILESBROWSER_USER_DEFAULT_ENABLE', false);

/**
 * General Files settings 
 */
define('PLUGIN_FILESATTCHMENT_SERVER', "demo.files.org");
define('PLUGIN_FILESATTCHMENT_USE_SSL', true);
define('PLUGIN_FILESATTCHMENT_PATH', "/remote.php/webdav");
define('PLUGIN_FILESATTCHMENT_USE_SESSION_AUTH', true);
define('PLUGIN_FILESATTCHMENT_USER', "defaultusername");
define('PLUGIN_FILESATTCHMENT_PASS', "defaultpassword");
define('PLUGIN_FILESATTCHMENT_BACKEND', "webdav");
define('PLUGIN_FILESATTCHMENT_PORT', "80");
define('PLUGIN_FILESATTCHMENT_PORTSSL', "443");
define('PLUGIN_FILESATTCHMENT_ASK_BEFORE_DELETE', true);

/** 
 * Button Name shown in the webapp
 */
define('PLUGIN_FILESBROWSER_BUTTONNAME', "Files");

/** 
 * Temporary directory where we can write the cache.
 * Enable caching. Disable caching if you encounter problems!
 */
define('PLUGIN_FILESBROWSER_TMP', "/tmp/");
define('PLUGIN_FILESBROWSER_ENABLE_CACHE', false);

/** 
 * Enable loading of ext.ux.media extension
 * Used to preview pdf and media files
 * This setting is not editable within webapp!! 
 */
define('PLUGIN_FILESBROWSER_ENABLE_UXMEDIA', true);
?>
