<?php
include $_SERVER['DOCUMENT_ROOT']. "/assets/php/user_auth.php"; // sets $dbh, $loggedIn

if(!$loggedIn && $_POST){
    $user = strtolower($_POST['username']);
    if($user && $_POST['password'] && $_POST['password']!="" && preg_match('/^[a-z0-9_]+$/', $user)==1){
        //$result = $db->query("SELECT password FROM users WHERE username = '$user'");
        $sth = $dbh->prepare("SELECT password FROM users WHERE username = :username");
        $sth->execute(array(":username"=>$user));
        if($res = $sth->fetch()){
            if(password_verify($_POST['password'] , $res['password'])){
                $_SESSION["user"] = $user;
                
                if(isset($_GET['redirect'])){
                    header("Location: ".$_GET['redirect']);
                }
                else {
                    header("Location: ../editor/");    
                }
                
                exit();
            }
        }
    }
    echo "<script type='text/javascript'>
    alert('Invaild username or password!');
    window.location.href = './login.php?username=$user&';
    </script>";
    exit();
}

if($loggedIn) {
    if(isset($_GET['redirect'])){
        echo "<script type='text/javascript'>
            alert('You are already logged in!');
            window.location.href = '".$_GET['redirect']."';
            </script>";
    }
    else {
        echo "<script type='text/javascript'>
            alert('You are already logged in!');
            window.location.href = '../';
            </script>";
    }
    exit();
}
else {
    echo "<script type='text/javascript'>
alert('Invaild username or password!');
window.location.href = './login.php';
</script>";
exit();
}


?>