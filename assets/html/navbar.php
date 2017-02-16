<!-- navbar -->
<div class="navbar navbar-inverse navbar-fixed-top" role="navigation">
    <div class="container">
        <div class="navbar-header">
            <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target=".navbar-collapse">
                <span class="sr-only">Toggle navigation</span>
                <span class="icon-bar"></span>
                <span class="icon-bar"></span>
                <span class="icon-bar"></span>
            </button>
            <a class="navbar-brand" href="/">IPAR</a>
        </div>
        <div class="navbar-collapse collapse">
            <ul class="nav navbar-nav navbar-left">
                <li><a href="/">Home</a></li>
                <li><a href="/about.php">About</a></li>
                <li><a href="/ipar/editor/">Editor</a></li>
                <li><a href="/ipar/">Play Now</a></li>
            </ul>
            <ul class="nav navbar-nav navbar-right drawer-handle">
                <li>
                    <a href="#">Account</a>
                    <ul class="nav pull-left navbar-inverse drawer">
                        <li><a href="#" data-toggle="modal" data-target="#loginModal">Log In</a></li>
                        <li><a href="#" data-toggle="modal" data-target="#newAccountModal">Create New</a></li>
                    </ul>
                </li>
            </ul>
        </div>
    </div>
</div>
<!-- navbar end -->
<!-- login modal -->
<div class="modal fade" id="loginModal" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Log In</h3>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">×</span>
                </button>
            </div>
            <div class="modal-body">
                <form>
                    <div class="row">
                        <div class="col-md-12"><label>Username:</label></div>
                    </div>
                    <div class="row">
                        <div class="col-md-12"><input type="text" style="width:100%;"></div>
                    </div>
                    <div class="row">
                        <div class="col-md-12"><label>Password:</label></div>
                    </div>
                    <div class="row">
                        <div class="col-md-12"><input type="password" style="width:100%;"></div>
                    </div>
                    <div class="row">
                        <div class="col-md-12">
                            <a href="#">Forgot Password</a>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-12">
                            <a href="#">Forgot Username</a>
                        </div>
                    </div>
                </form>
                
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary">Log In</button>
            </div>
        </div>
    </div>
</div>
<!-- login modal end -->
<!-- new user modal -->
<div class="modal fade" id="newAccountModal" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">New Account</h3>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">×</span>
                </button>
            </div>
            <div class="modal-body">
                <form>
                    <div class="row">
                        <div class="col-md-12"><label>Username:</label></div>
                    </div>
                    <div class="row">
                        <div class="col-md-12"><input type="text" style="width:100%;"></div>
                    </div>
                    <div class="row">
                        <div class="col-md-12"><label>Email:</label></div>
                    </div>
                    <div class="row">
                        <div class="col-md-12"><input type="text" style="width:100%;"></div>
                    </div>
                    <div class="row">
                        <div class="col-md-12"><label>Password:</label></div>
                    </div>
                    <div class="row">
                        <div class="col-md-12"><input type="password" style="width:100%;"></div>
                    </div>
                    <div class="row">
                        <div class="col-md-12"><label>Confirm Password:</label></div>
                    </div>
                    <div class="row">
                        <div class="col-md-12"><input type="password" style="width:100%;"></div>
                    </div>
                    <div class="row">
                        <div class="col-md-12"><label>First Name:</label></div>
                    </div>
                    <div class="row">
                        <div class="col-md-12"><input type="text" style="width:100%;"></div>
                    </div>
                    <div class="row">
                        <div class="col-md-12"><label>Last Name:</label></div>
                    </div>
                    <div class="row">
                        <div class="col-md-12"><input type="text" style="width:100%;"></div>
                    </div>
                    <div class="row">
                        <div class="col-md-12"><label>Organization:</label></div>
                    </div>
                    <div class="row">
                        <div class="col-md-12"><input type="text" style="width:100%;"></div>
                    </div>
                </form>
                
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary">Create Account</button>
            </div>
        </div>
    </div>
</div>
<!-- new user modal end -->