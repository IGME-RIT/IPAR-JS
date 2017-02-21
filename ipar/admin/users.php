<?php
/* Displays list of all IPAR users
 * $dbh should be set by included scripts in checkAdmin.php,
 * appended to this file by /admin/.htaccess
 */

$query =    "SELECT users.*, usermetadata.ip, usermetadata.useragent, usermetadata.datetime FROM users 
            LEFT JOIN usermetadata
            ON users.username = usermetadata.username";
if(!$res = $dbh->query($query)){
    print_r($dbh->errorinfo());
    die("Failed to read from database.");
}

// prepare user roles statement
$rolesth =  $dbh->prepare("SELECT name, id, (username IS NOT NULL) AS hasrole FROM (
                            SELECT users_roles.username, roles.name, roles.rowid as id FROM roles
                            LEFT JOIN users_roles 
                            ON (users_roles.username=:username And roles.rowid = users_roles.roleid));");

?>

<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>IPAR - Users</title>
        <?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/head.php'; ?>
        <script type="text/javascript">
            function roleCheckbox(element){
                // make an ajax call to set the user's roles
                var roleid = element.getAttribute("data-roleid");
                var user = element.getAttribute("data-user");
                var value = element.checked ? 1 : 0;

                console.log("Setting role '" + element.value + " (" + roleid + ")' as " + value + " for user " + user); 
                
                var request = new XMLHttpRequest();
                request.open("POST", "setUserRole.php");
//                request.onreadystatechange = function() {
//                    if(request.readyState === XMLHttpRequest.DONE) {
//                        alert(request.responseText);
//                    }
//                }
                //TODO: alert on errors
                request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                request.send('user='+user+"&roleid="+roleid+"&value="+value);
            }
        </script>
    </head>
    <body>
        <?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/navbar.php'; ?>
		<div class="jumbotron">
			<div class="container">
                <div class="row">
                    <div class="col-md-12 col-vcenter">
                        <h1 class="uline">Users</h1>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
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
                                    <td class="wrap"><?php echo $row['organization'] ?></td>
                                    <td>
                                        <?php 
                                        while($rolerow = $rolesth->fetch()) { 
                                           ?>
                                            <label>
                                                <input 
                                                    type="checkbox"
                                                    value="<?php echo $rolerow['name']; ?>" 
                                                    <?php if($rolerow['hasrole'] == 1) {?> 
                                                    checked="checked" <?php } ?> 
                                                    data-user="<?php echo $row['username'];?>" 
                                                    data-roleid="<?php echo $rolerow['id']; ?>" 
                                                    onchange="roleCheckbox(this);"
                                                    <?php if($rolerow['name'] == "admin" && $row['username'] == $_SESSION['user']) echo "disabled"; ?>
                                                > 
                                                <?php echo $rolerow['name']; ?>
                                            </label>
                                            <br/>
                                           <?php 
                                        } 
                                        ?>
                                    </td>
                                    <td><?php echo $ip ?></td>
                                    <td class="of-scroll"><?php echo $row['useragent'] ?></td>
                                    <td class="wrap"><?php echo $date ?></td>
                                </tr>
                                <?php
                            }
                            ?>
                        </table>
                    </div>
                    <div class="row">
                        <div class="col-md-12">
                            <a href="./" class="btn btn-primary" style="width: 100%; margin-top: 0.3em; font-size: 16pt;"><span class="glyphicon glyphicon-arrow-left" aria-hidden="true" ></span> Back</a>
                        </div>
                    </div>
                </div>
		    </div>
		</div>
        <? include $_SERVER['DOCUMENT_ROOT'].'/assets/html/footer.php'; ?>
    </body>
</html>