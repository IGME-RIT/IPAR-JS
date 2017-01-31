<?php
$dbh = new PDO("sqlite:../../../db/users.sql");
$query =    "SELECT users.*, usermetadata.ip, usermetadata.useragent, usermetadata.datetime FROM users 
            LEFT JOIN usermetadata
            ON users.username = usermetadata.username";
if(!$res = $dbh->query($query)){
    print_r($dbh->errorinfo());
    die("Failed to read from database.");
}

// prepare roles statement
$rolesth = $dbh->prepare("SELECT roles.name FROM users_roles 
                            INNER JOIN roles ON users_roles.roleid = roles.rowid 
                            WHERE users_roles.username = :username")

?>

<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>IPAR</title>
        <link href="https://fonts.googleapis.com/css?family=Quicksand:700" rel="stylesheet" type="text/css">
        <link rel="stylesheet" type="text/css" href="../css/styles.css">
        <link rel="stylesheet" type="text/css" href="../css/menuStyle.css">
    </head>
    <body>
        <section class="menu">
            <div>
                <h1 style="text-align:left;">Users</h1>
                <table>
                    <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Firstname</th>
                        <th>Lastname</th>
                        <th>Organization</th>
                        <th>Role(s)</th>
                        <th>IP Address</th>
                        <th>Useragent</th>
                        <th>Signup Date</th>
                    </tr>
                    <?php
                    foreach($res as $row){
                        $ip = long2ip($row['ip']);
                        $date = date("m/d/Y H:i:s", $row['datetime']);
        
                        // get roles
                        if(!$rolesth->execute(array(":username"=>$row['username']))){
                            print_r($dbh->errorinfo());
                            die("\n Failed to get roles for user ".$row['username']);
                        }
                 
                    ?>
                        <tr>
                            <td><?php echo $row['username']; ?></td>
                            <td><?php echo "<a href='mailto:".$row['email']."'>".$row['email']."</a>"; ?></td>
                            <td><?php echo $row['firstname']; ?></td>
                            <td><?php echo $row['lastname']; ?></td>
                            <td><?php echo $row['organization'] ?></td>
                            <td><?php while($rolerow = $rolesth->fetch()) { echo $rolerow['name'].","; } ?></td>
                            <td><?php echo $ip ?></td>
                            <td><?php echo $row['useragent'] ?></td>
                            <td><?php echo $date ?></td>
                        </tr>
                        <?php
                    }
                    ?>
                </table>
                <a href="./index.php" class="menuButton">Back</a>
            </div>
        </section>
    </body>
</html>