<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<title>IPAR</title>
    <?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/head.php'; ?>
</head>
<body>
    <?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/navbar.php'; ?>
    <!--section class="menu">
    	<div>
    		<p id="message"></p>
			<a id="back" href="/ipar/" class="menuButton">Back</a>
		</div>
		<img class="logo" src="../img/nsflogo.png" />
    </section-->
	<div class="jumbotron">
        <div class="container">
            <div class="row">
                <div class="col-md-12">
                    <h3>Message</h3>
                </div>
            </div>
            <div class="row">
                <div class="col-md-12">
                    <p id="message"></p>
                </div>
            </div>
            <div class="row">
                <div class="col-md-12">
                    <a id="back" href="./" class="btn btn-primary" style="display: block; width: 100% max-width: 500px; font-size:14pt; margin: 0 auto;"><span class="glyphicon glyphicon-arrow-left" aria-hidden="true"></span> Back</a>
                </div>
            </div>
        </div>
    </div>
    
    <script type='text/javascript'>
        function parseURLParams(url) {
            var queryStart = url.indexOf("?") + 1,
                queryEnd   = url.indexOf("#") + 1 || url.length + 1,
                query = url.slice(queryStart, queryEnd - 1),
                pairs = query.replace(/\+/g, " ").split("&"),
                parms = {}, i, n, v, nv;
            
            if (query === url || query === "") return;
            
            for (i = 0; i < pairs.length; i++) {
                nv = pairs[i].split("=", 2);
                n = decodeURIComponent(nv[0]);
                v = decodeURIComponent(nv[1]);
                
                if (!parms.hasOwnProperty(n)) parms[n] = [];
                parms[n].push(nv.length === 2 ? v : null);
            }
            return parms;
        }
        var get = parseURLParams(window.location.search);
        
        var message = get["message"];
		document.getElementById("message").innerHTML = decodeURIComponent(message);
        
        // get redirect location if set
        if("redirect" in get && get["redirect"] != "") {
            document.getElementById("back").href = get["redirect"];
        }
	</script>
    <?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/footer.php'; ?>
</body>
</html>
