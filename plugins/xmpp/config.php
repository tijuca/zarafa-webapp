<?php
// Enable the xmpp plugin for all clients
define('PLUGIN_XMPP_USER_DEFAULT_ENABLE', false);

// Define the server to connect to
define('PLUGIN_XMPP_CONNECT_DOMAIN', 'chat.zarafa.com');

// Define the name of the client that is being used
define('PLUGIN_XMPP_CONNECT_RESOURCE', 'zarafa-webaccess');

define('PLUGIN_XMPP_CONNECT_HTTPBASE', '/http-bind/');

// Use SSL
define('PLUGIN_XMPP_CONNECT_SSL', false);

// jabber server port
define('PLUGIN_XMPP_CONNECT_PORT', 5280);
?>
