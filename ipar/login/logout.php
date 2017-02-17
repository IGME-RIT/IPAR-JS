<?php
	session_start();
	session_unset();
	session_destroy();
    
    if(isset($_GET['redirect'])){
        header("Location: ".$_GET['redirect']);
    }
    else{
        header("Location: /");
    }
?>