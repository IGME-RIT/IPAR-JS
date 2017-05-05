<?php
/* Utility fucntions for IPAR services */

// require random_compat for PHP7-like random fucntions
require_once $_SERVER['DOCUMENT_ROOT'].'/assets/php/random_compat.phar';

// generates a random hex key (for email verification and password reset)
function gen_key($length = 32) {
	$bytes = random_bytes($length);
	return bin2hex($bytes);
}
