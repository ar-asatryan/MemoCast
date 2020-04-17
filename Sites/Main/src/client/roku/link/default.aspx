<%@ Page Title="" Language="C#" MasterPageFile="~/roku/RokuMasterPage.Master" AutoEventWireup="true" CodeBehind="default.aspx.cs" Inherits="Memocast.Web.roku.link._default" %>

<asp:Content ID="Content1" ContentPlaceHolderID="header" runat="server">

    <asp:PlaceHolder ID="phNotLogged" runat="server">

        <h1>Linking Roku device to your account</h1>
        <h3>Please login to link your Roku device</h3>
        <hr class="intro-divider" />
        <ul class="list-inline intro-social-buttons">
            <li>
                <a href="/login.aspx" class="btn btn-default btn-lg"><span class="network-name">Sign In</span></a>
            </li>
            <li>
                <a href="/signup.aspx" class="btn btn-default btn-lg"><span class="network-name">Create new account</span></a>
            </li>
        </ul>

    </asp:PlaceHolder>

    <asp:PlaceHolder ID="phIsGold" runat="server">

        <asp:PlaceHolder ID="phRokuRegister" runat="server">
            
            <h1>Linking Roku device to your account</h1>
            <h3>Use the code bellow to link your Roku device</h3>
            <hr class="intro-divider" />
            <h1><asp:Label runat="server" ID="lblActivationCode" /></h1>
        </asp:PlaceHolder>

        <asp:PlaceHolder ID="phRokuAlreadyRegistered" runat="server">

            <h1>Your device already linked!</h1>
            <h3>You need to un-link previoud device before linking</h3>
            <hr class="intro-divider" />
            <form runat="server">
                <ul class="list-inline intro-social-buttons">
                    <li>
                        <asp:LinkButton runat="server" CssClass="btn btn-default btn-lg" Text="Unlink Device" OnClick="UnlinkDevice_Click" />
                    </li>
                </ul>
            </form>
        </asp:PlaceHolder>
    </asp:PlaceHolder>

    <asp:PlaceHolder ID="phNotGold" runat="server">
        <h1>Linking Roku device to your account</h1>
        <h3>Please purchase subscription</h3>
        <hr class="intro-divider" />
        <ul class="list-inline intro-social-buttons">
            <li>
                <a href="/profiles/subscription/" class="btn btn-default btn-lg"><span class="network-name">Become Gold Member</span></a>
            </li>
        </ul>
    </asp:PlaceHolder>

</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="content" runat="server">
</asp:Content>
<asp:Content ID="Content3" ContentPlaceHolderID="footer" runat="server">
</asp:Content>
