<?php
/* util.php needs the BASE_PATH set to webapp's root */
define('BASE_PATH', __DIR__ . '/../../../');
require_once(__DIR__ . "/../../../server/includes/util.php");

$limits = array(
	"upload_max_filesize" => getMaxUploadSize(),
	"post_max_size" => getMaxPostRequestSize()
);

echo json_encode($limits);
?>
