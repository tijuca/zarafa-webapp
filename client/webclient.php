<?php
include(__DIR__ . '/loader.php');

$loader = new FileLoader();

$cssTemplate = "\t\t<link rel=\"stylesheet\" type=\"text/css\" href=\"{file}\">\n";
$jsTemplate = "\t\t<script type=\"text/javascript\" src=\"{file}\"></script>\n";

$version = trim(file_get_contents('version'));

?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>

	<head>
		<meta name="Generator" content="Zarafa WebApp v<?php echo$version?>">
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<title>Zarafa WebApp</title>
		<link rel="icon" href="client/resources/images/favicon.ico" type="image/x-icon">
		<link rel="shortcut icon" href="client/resources/images/favicon.ico" type="image/x-icon">
		<?php
			$extjsFiles = $loader->getExtjsCSSFiles(DEBUG_LOADER);
			$loader->printFiles($extjsFiles, $cssTemplate);

			$webappFiles = $loader->getZarafaCSSFiles(DEBUG_LOADER);
			$loader->printFiles($webappFiles, $cssTemplate);

			$pluginFiles = $loader->getPluginCSSFiles(DEBUG_LOADER);
			$loader->printFiles($pluginFiles, $cssTemplate);

			$remoteFiles = $loader->getRemoteCSSFiles(DEBUG_LOADER);
			$loader->printFiles($remoteFiles, $cssTemplate);
		?>
	</head>

	<body>
		<div id="loading-mask"></div>
		<div id="loading">
			<img src="client/resources/images/Zarafa_logo_transparent.png" />
			<span id="loading-message" class="loading"><?php echo _('Loading Zarafa WebApp ...') ?></span>
		</div>

		<!-- Translations -->
		<script type="text/javascript" src="index.php?version=<?php echo $version ?>&amp;load=translations.js&amp;lang=<?php echo $GLOBALS["language"]->getSelected() ?>"></script>

		<!-- ExtJS & Thirdparty extensions-->
		<?php
			$extjsFiles = $loader->getExtjsJavascriptFiles(DEBUG_LOADER);
			$loader->printFiles($extjsFiles, $jsTemplate);
		?>

		<!-- Zarafa client stuff -->
		<?php
			$webappFiles = $loader->getZarafaJavascriptFiles(DEBUG_LOADER, $extjsFiles);
			$loader->printFiles($webappFiles, $jsTemplate);

			$pluginFiles = $loader->getPluginJavascriptFiles(DEBUG_LOADER, array_merge($extjsFiles, $webappFiles));
			$loader->printFiles($pluginFiles, $jsTemplate);

			$remoteFiles = $loader->getRemoteJavascriptFiles(DEBUG_LOADER);
			$loader->printFiles($remoteFiles, $jsTemplate);
		?>

		<script type="text/javascript">
			settings = <?php echo JSON::Encode($GLOBALS["settings"]->getJSON()); ?>;
		</script>
		<script type="text/javascript">
			languages = <?php echo JSON::Encode($GLOBALS["language"]->getJSON()); ?>;
		</script>

		<script type="text/javascript">
			user = {
				username					: "<?php echo addslashes($GLOBALS["mapisession"]->getUserName()) ?>",
				fullname					: "<?php echo addslashes($GLOBALS["mapisession"]->getFullName()) ?>",
				entryid						: "<?php echo bin2hex($GLOBALS["mapisession"]->getUserEntryid()) ?>",
				email_address				: "<?php echo addslashes($GLOBALS["mapisession"]->getEmailAddress()) ?>",
				smtp_address				: "<?php echo addslashes($GLOBALS["mapisession"]->getSMTPAddress()) ?>",
				search_key					: "<?php echo bin2hex($GLOBALS["mapisession"]->getSearchKey()) ?>",
				user_image					: "<?php echo bin2hex($GLOBALS["mapisession"]->getUserImage()) ?>",
				sessionid					: "<?php echo $GLOBALS["mapisession"]->getSessionID() ?>",
				given_name					: "<?php echo addslashes($GLOBALS["mapisession"]->getGivenName()) ?>",
				initials					: "<?php echo addslashes($GLOBALS["mapisession"]->getInitials()) ?>",
				surname						: "<?php echo addslashes($GLOBALS["mapisession"]->getSurname()) ?>",
				street_address				: "<?php echo addslashes($GLOBALS["mapisession"]->getStreetAddress()) ?>",
				locality					: "<?php echo addslashes($GLOBALS["mapisession"]->getLocality()) ?>",
				state_or_province			: "<?php echo addslashes($GLOBALS["mapisession"]->getStateOrProvince()) ?>",
				postal_code					: "<?php echo addslashes($GLOBALS["mapisession"]->getPostalCode()) ?>",
				country						: "<?php echo addslashes($GLOBALS["mapisession"]->getCountry()) ?>",
				title						: "<?php echo addslashes($GLOBALS["mapisession"]->getTitle()) ?>",
				company_name				: "<?php echo addslashes($GLOBALS["mapisession"]->getCompanyName()) ?>",
				department_name				: "<?php echo addslashes($GLOBALS["mapisession"]->getDepartmentName()) ?>",
				office_location				: "<?php echo addslashes($GLOBALS["mapisession"]->getOfficeLocation()) ?>",
				assistant					: "<?php echo addslashes($GLOBALS["mapisession"]->getAssistant()) ?>",
				assistant_telephone_number	: "<?php echo addslashes($GLOBALS["mapisession"]->getAssistantTelephoneNumber()) ?>",
				office_telephone_number		: "<?php echo addslashes($GLOBALS["mapisession"]->getOfficeTelephoneNumber()) ?>",
				business_telephone_number	: "<?php echo addslashes($GLOBALS["mapisession"]->getBusinessTelephoneNumber()) ?>",
				business2_telephone_number	: "<?php echo addslashes($GLOBALS["mapisession"]->getBusiness2TelephoneNumber()) ?>",
				primary_fax_number			: "<?php echo addslashes($GLOBALS["mapisession"]->getPrimaryFaxNumber()) ?>",
				home_telephone_number		: "<?php echo addslashes($GLOBALS["mapisession"]->getHomeTelephoneNumber()) ?>",
				home2_telephone_number		: "<?php echo addslashes($GLOBALS["mapisession"]->getHome2TelephoneNumber()) ?>",
				mobile_telephone_number		: "<?php echo addslashes($GLOBALS["mapisession"]->getMobileTelephoneNumber()) ?>",
				pager_telephone_number		: "<?php echo addslashes($GLOBALS["mapisession"]->getPagerTelephoneNumber()) ?>"
			};
		</script>

		<script type="text/javascript">
			version = {
				webapp			: "<?php echo $version ?>",
				zcp			: "<?php echo phpversion('mapi') ?>",
				server			: "<?php echo DEBUG_SHOW_SERVER ? DEBUG_SERVER_ADDRESS : '' ?>",
				svn			: "<?php echo DEBUG_LOADER === LOAD_SOURCE ? svnversion() : '' ?>"
			};
		</script>

		<script type="text/javascript">
			serverconfig = {
				enable_plugins			: <?php echo ENABLE_PLUGINS ? 'true' : 'false' ?>,
				enable_advanced_settings	: <?php echo ENABLE_ADVANCED_SETTINGS ? 'true' : 'false' ?>,
				max_attachments			: undefined,
				max_attachment_size		: <?php echo getMaxUploadSize() ?>,
				post_max_size			: <?php echo getMaxPostRequestSize() ?>,
				max_file_uploads		: <?php echo getMaxFileUploads() ?>,
				max_attachment_total_size	: undefined,
				freebusy_load_start_offset : <?php echo FREEBUSY_LOAD_START_OFFSET ?>,
				freebusy_load_end_offset : <?php echo FREEBUSY_LOAD_END_OFFSET ?>,
				client_timeout 			: <?php echo defined('CLIENT_TIMEOUT') && is_numeric(CLIENT_TIMEOUT) && CLIENT_TIMEOUT>0 ? CLIENT_TIMEOUT : 'false' ?>,
				version_info			: <?php echo getPluginsVersionInfo() ?>,
				contact_prefix			: <?php echo CONTACT_PREFIX ? CONTACT_PREFIX : 'undefined' ?>,
				contact_suffix			: <?php echo CONTACT_SUFFIX ? CONTACT_SUFFIX : 'undefined' ?>,
				color_schemes			: <?php echo COLOR_SCHEMES ?>,
				additional_color_schemes: <?php echo defined('ADDITIONAL_COLOR_SCHEMES') ? ADDITIONAL_COLOR_SCHEMES : 'undefined' ?>,
				maximum_eml_files_in_zip: <?php echo MAX_EML_FILES_IN_ZIP ?>,
				powerpaste: <?php echo json_encode(Array('powerpaste_word_import' => POWERPASTE_WORD_IMPORT, 'powerpaste_html_import' => POWERPASTE_HTML_IMPORT, 'powerpaste_allow_local_images' => POWERPASTE_ALLOW_LOCAL_IMAGES)); ?> 
			};
		</script>

		<!-- get URL data from session and dump it for client to use -->
		<?php
			$urlActionData = array();
			if(!empty($_SESSION['url_action'])) {
				$urlActionData = $_SESSION['url_action'];

				// remove data from session so if user reloads webapp then we will again not execute url action
				unset($_SESSION['url_action']);
			}
		?>

		<script type="text/javascript">
			urlActionData = <?php echo JSON::Encode($urlActionData); ?>;
		</script>

		<script type="text/javascript">
			Ext.onReady(Zarafa.loadWebclient, Zarafa);
		</script>
	</body>
</html>
