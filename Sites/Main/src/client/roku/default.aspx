<%@ Page Title="Watch Memocast on TV with ROKU!" Language="C#" MasterPageFile="~/roku/RokuMasterPage.Master" AutoEventWireup="true" CodeBehind="default.aspx.cs" Inherits="Memocast.Web.roku._default" %>

<asp:Content ContentPlaceHolderID="content" runat="server">

    <div class="content-section-a" id="instruction">
        <div class="container">
            <div class="row">
                <div class="col-lg-5 col-sm-6">
                    <h2 class="section-heading">Add Memocast Channel</h2>
                    <ul class="lead">
                        <li><a href="https://www.roku.com" target="_blank">Open Roku site</a></li>
                        <li>Sign In to your Roku account</li>
                        <li>Open your <a href="https://my.roku.com/account" target="_blank">account settings</a></li>
                        <li>In &quot;Manage Account&quot; section of the page click on <a href="https://my.roku.com/account/add" target="_blank">Add a Channel</a></li>
                        <li>Enter access code!!! <% = Memocast.Shared.Settings.RokuAppAccessCode %> and click &quot;Add Channel&quot;</li>
                        <li>Memocast Channel will appear on your Roku device in a few minutes</li>
                    </ul>
                </div>
                <div class="col-lg-5 col-lg-offset-2 col-sm-6">
                    <img class="img-responsive" src="img/screens/roku-site-add-channel.png" />
                </div>
            </div>
        </div>
    </div>

    <div class="content-section-b">
        <div class="container">

            <div class="row">
                <div class="col-lg-5 col-lg-offset-1 col-sm-push-6  col-sm-6">
                    <h2 class="section-heading">Link your Roku with Memocast</h2>
                    <ul class="lead">
                        <li>Open Memocast Channel on your Roku</li>
                        <li>Log into your Memocast Gold Membership account from a browser to get a PIN CODE</li>
                        <li><a href="/roku/link/" target="_blank">Get activation PIN CODE here</a></li>
                        <li>Enter activation 6 digit PIN CODE on Roku</li>
                    </ul>
                    <p class="lead">
                        There may be a delay between the time it takes to update your Roku player and the message you see on the TV.  Please wait a few minutes.
                    </p>
                </div>
                <div class="col-lg-5 col-sm-pull-6  col-sm-6">
                    <img class="img-responsive" src="img/screens/roku-entering-pin-code.jpg" alt="">
                </div>
            </div>

        </div>

    </div>

    <div class="container" style="display: none;">
        <div class="row">
            <div class="col-lg-5 col-sm-6">
                <h2 class="section-heading">Done!<br />
                    Enjoy Memocast on your Roku!</h2>
                <p class="lead">Thank YOU!</p>
            </div>
            <div class="col-lg-5 col-lg-offset-2 col-sm-6">
                <img class="img-responsive" src="img/screens/roku-enjoy.jpg" />
            </div>
        </div>
    </div>

    <div class="container">
        <div class="row">
            <div class="col-lg-12 col-sm-12 text-center" style="font-weight: 300;">
                <h2 style="font-weight: 300;">Done! Enjoy Memocast on your Roku!</h2>
                <h2 style="font-weight: 300;">Thank YOU!</h2>
                <hr />
                <p class="lead">For further assistance please call our Tech Support line we will be happy to help you.</p>
            </div>
        </div>
    </div>

</asp:Content>
<asp:Content ContentPlaceHolderID="footer" runat="server">
</asp:Content>

<asp:Content ContentPlaceHolderID="header" runat="server">

    <h1>Watch Memocast on TV with ROKU!</h1>
    <h3>Memocast channel on ROKU (access code <% = Memocast.Shared.Settings.RokuAppAccessCode %>)</h3>
    <hr class="intro-divider">
</asp:Content>
