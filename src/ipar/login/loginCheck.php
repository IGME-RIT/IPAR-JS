<?php 
include $_SERVER['DOCUMENT_ROOT']. "/assets/php/user_auth.php";
include $_SERVER['DOCUMENT_ROOT']. "/assets/php/util.php";

if(!$loggedIn && $_POST){
    $user = htmlspecialchars($_POST['username']);
    if($user && $_POST['password'] && $_POST['password']!="" && preg_match('/^[a-z0-9_]+$/', $user)==1){
        //$result = $db->query("SELECT password FROM users WHERE username = '$user'");
        $sth = $dbh->prepare("SELECT password FROM users WHERE username = :username");
        $sth->execute(array(":username"=>$user));
        if($res = $sth->fetch()){
            if(password_verify($_POST['password'] , $res['password'])){
                $_SESSION["user"] = $user;
                
                if(isset($_GET['redirect']) && is_safe_url($_GET['redirect'])){
					header_redirect($_GET['redirect']);
                }
                else {
					header_redirect();
                }
                
                exit();
            }
        }
    }
    $loc = "login.php?username=$user&";
    if(isset($_GET['redirect'])) {
        $loc."redirect=".encode_url($_GET['redirect'])."&";
    }

	js_redirect($loc, "Invalid username or password!", false);
    exit();
}

if($loggedIn) {
    if(isset($_GET['redirect']) && is_safe_url($_GET['redirect'])){
		js_redirect($_GET['redirect'], "You are already logged in!");
    }
    else {
		js_redirect("/", "You are already logged in!");
    }
    exit();
}
else {
	js_redirect("login.php", "Invalid username or password!");
	exit();
}


?>
