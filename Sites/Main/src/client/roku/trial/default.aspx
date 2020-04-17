<%@ Page Title="Memocast: ROKU trial subscription activation" Language="C#" MasterPageFile="~/roku/RokuMasterPage.Master" AutoEventWireup="true" CodeBehind="default.aspx.cs" Inherits="Memocast.Web.roku.trial._default" %>
<asp:Content ID="Content1" ContentPlaceHolderID="header" runat="server">

    <h2></h2>

    <asp:PlaceHolder ID="phNotAuthenticated" runat="server">
        <h1>3 DAY FREE Memocast access on Roku</h1>
        <hr class="intro-divider" />
        <h3>Activate your Free Trial to access over 100 thousand Memocast movies on your ROKU device</h3>
        <hr class="intro-divider" />
        <h3>Please Login or Create new account to activate your Free Trial</h3>
        <hr class="intro-divider" />
        <ul class="list-inline intro-social-buttons">
            <li>
                <a href="/login.aspx" class="btn btn-default btn-lg"><span class="network-name">Login</span></a>
            </li>
            <li>
                <a href="/signup.aspx" class="btn btn-default btn-lg"><span class="network-name">Create new account</span></a>
            </li>
        </ul>
    </asp:PlaceHolder>

    <asp:PlaceHolder ID="phAuthenticated" runat="server">

        <asp:PlaceHolder ID="phIsGold" runat="server">
            <h1>ROKU trial subscription activation</h1>
            <h3>You already have valid subscription to watch Memocast on your Roku device</h3>
            <hr class="intro-divider" />
            <ul class="list-inline intro-social-buttons">

                <li>
                    <a href="/roku/" class="btn btn-default btn-lg"><span class="network-name">How to link my Roku to Memocast?</span></a>
                </li>

            </ul>
        </asp:PlaceHolder>

        <asp:PlaceHolder ID="phNotGold" runat="server">
            
            <asp:PlaceHolder ID="phTrialWasActivatedAlready" runat="server">
                <h1>Roku status</h1>
                <h3>Your Free Trial has been expired</h3>
                <hr class="intro-divider" />
                <h3>Please become Gold Member for full access</h3>
                <hr class="intro-divider" />
                <ul class="list-inline intro-social-buttons">
                    <li>
                        <a href="/profiles/subscription/" class="btn btn-default btn-lg"><span class="network-name">Become Gold Member</span></a>
                    </li>
                </ul>
            </asp:PlaceHolder>

            <asp:PlaceHolder ID="phTrialActivation" runat="server">
                <h1>Special Offer!</h1>
                <hr class="intro-divider" />
                <h3>3 Day Free access on ROKU device for Memocast Members!</h3>
                <hr class="intro-divider" />
                <ul class="list-inline intro-social-buttons">
                    <li>
                        <form runat="server">
                        <asp:LinkButton runat="server" CssClass="btn btn-default btn-lg" OnClick="ActivateLink_Click"><span class="network-name">Activate Trial Subscription</span></asp:LinkButton>
                        </form>
                    </li>
                </ul>
            </asp:PlaceHolder>

        </asp:PlaceHolder>

    </asp:PlaceHolder>

</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="content" runat="server">

</asp:Content>
<asp:Content ID="Content3" ContentPlaceHolderID="footer" runat="server">
</asp:Content>
