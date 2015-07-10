<?php
include("client/loader.php");

$loader = new FileLoader();

$cssTemplate = "\t\t<link rel=\"stylesheet\" type=\"text/css\" href=\"{file}\">\n";
$jsTemplate = "\t\t<script type=\"text/javascript\" src=\"{file}\"></script>\n";

$version = trim(file_get_contents('version'));

?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>

	<head>
		<meta name="Generator" content="Zarafa WebApp v<?php echo $version?>">
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
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
		<script type="text/javascript" src="index.php?version=<?php echo $version?>&load=translations.js&lang=<?php echo $GLOBALS["language"]->getSelected()?>"></script>

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
				username		: "<?php echo addslashes($GLOBALS["mapisession"]->getUserName()) ?>",
				fullname		: "<?php echo addslashes($GLOBALS["mapisession"]->getFullName()) ?>",
				entryid			: "<?php echo bin2hex($GLOBALS["mapisession"]->getUserEntryid()) ?>",
				email_address		: "<?php echo addslashes($GLOBALS["mapisession"]->getEmailAddress()) ?>",
				smtp_address		: "<?php echo addslashes($GLOBALS["mapisession"]->getSMTPAddress()) ?>",
				search_key		: "<?php echo bin2hex($GLOBALS["mapisession"]->getSearchKey()) ?>",
				sessionid		: "<?php echo $GLOBALS["mapisession"]->getSessionID() ?>"
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
				max_attachment_total_size	: undefined,
				freebusy_load_start_offset : <?php echo FREEBUSY_LOAD_START_OFFSET ?>,
				freebusy_load_end_offset : <?php echo FREEBUSY_LOAD_END_OFFSET ?>,
				client_timeout 			: <?php echo defined('CLIENT_TIMEOUT') && is_numeric(CLIENT_TIMEOUT) && CLIENT_TIMEOUT>0 ? CLIENT_TIMEOUT : 'false' ?>
			};
		</script>

		<script type="text/javascript">
			Ext.onReady(Zarafa.loadWelcome, Zarafa);
		</script>
	</body>
</html>
