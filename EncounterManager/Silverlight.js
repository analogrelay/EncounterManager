if (!window.Silverlight)
{
    window.Silverlight = { };
}

// Silverlight control instance counter for memory mgt
Silverlight._silverlightCount = 0;
Silverlight.fwlinkRoot='http://go2.microsoft.com/fwlink/?LinkID=';  
Silverlight.onGetSilverlight = null;
Silverlight.onSilverlightInstalled = function () {window.location.reload(false);};

//////////////////////////////////////////////////////////////////
// isInstalled, checks to see if the correct version is installed
//////////////////////////////////////////////////////////////////
Silverlight.isInstalled = function(version)
{
    var isVersionSupported=false;
    var container = null;
    
    try 
    {
        var control = null;
        
        try
        {
            control = new ActiveXObject('AgControl.AgControl');
            if ( version == null )
            {
                isVersionSupported = true;
            }
            else if ( control.IsVersionSupported(version) )
            {
                isVersionSupported = true;
            }
            control = null;
        }
        catch (e)
        {
            var plugin = navigator.plugins["Silverlight Plug-In"] ;
            if ( plugin )
            {
                if ( version === null )
                {
                    isVersionSupported = true;
                }
                else
                {
                    var actualVer = plugin.description;
                    if ( actualVer === "1.0.30226.2")
                        actualVer = "2.0.30226.2";
                    var actualVerArray =actualVer.split(".");
                    while ( actualVerArray.length > 3)
                    {
                        actualVerArray.pop();
                    }
                    while ( actualVerArray.length < 4)
                    {
                        actualVerArray.push(0);
                    }
                    var reqVerArray = version.split(".");
                    while ( reqVerArray.length > 4)
                    {
                        reqVerArray.pop();
                    }
                    
                    var requiredVersionPart ;
                    var actualVersionPart
                    var index = 0;
                    
                    
                    do
                    {
                        requiredVersionPart = parseInt(reqVerArray[index]);
                        actualVersionPart = parseInt(actualVerArray[index]);
                        index++;
                    }
                    while (index < reqVerArray.length && requiredVersionPart === actualVersionPart);
                    
                    if ( requiredVersionPart <= actualVersionPart && !isNaN(requiredVersionPart) )
                    {
                        isVersionSupported = true;
                    }
                }
            }
        }
    }
    catch (e) 
    {
        isVersionSupported = false;
    }
    if (container) 
    {
        document.body.removeChild(container);
    }
    
    return isVersionSupported;
}
Silverlight.WaitForInstallCompletion = function()
{
    if ( ! Silverlight.isBrowserRestartRequired && Silverlight.onSilverlightInstalled )
    {
        try
        {
            navigator.plugins.refresh();
        }
        catch(e)
        {
        }
        if ( Silverlight.isInstalled(null) )
        {
            Silverlight.onSilverlightInstalled();
        }
        else
        {
              setTimeout(Silverlight.WaitForInstallCompletion, 3000);
        }    
    }
}
Silverlight.__startup = function()
{
    Silverlight.isBrowserRestartRequired = Silverlight.isInstalled(null);//(!window.ActiveXObject || Silverlight.isInstalled(null));
    if ( !Silverlight.isBrowserRestartRequired)
    {
        Silverlight.WaitForInstallCompletion();
    }
    if (window.removeEventListener) { 
       window.removeEventListener('load', Silverlight.__startup , false);
    }
    else { 
        window.detachEvent('onload', Silverlight.__startup );
    }
}

if (window.addEventListener) 
{
    window.addEventListener('load', Silverlight.__startup , false);
}
else 
{
    window.attachEvent('onload', Silverlight.__startup );
}

///////////////////////////////////////////////////////////////////////////////
// createObject();  Params:
// parentElement of type Element, the parent element of the Silverlight Control
// source of type String
// id of type string
// properties of type String, object literal notation { name:value, name:value, name:value},
//     current properties are: width, height, background, framerate, isWindowless, enableHtmlAccess, inplaceInstallPrompt:  all are of type string
// events of type String, object literal notation { name:value, name:value, name:value},
//     current events are onLoad onError, both are type string
// initParams of type Object or object literal notation { name:value, name:value, name:value}
// userContext of type Object
/////////////////////////////////////////////////////////////////////////////////

Silverlight.createObject = function(source, parentElement, id, properties, events, initParams, userContext)
{
    var slPluginHelper = new Object();
    var slProperties = properties;
    var slEvents = events;
    
    slPluginHelper.version = slProperties.version;
    slProperties.source = source;    
    slPluginHelper.alt = slProperties.alt;
    
    //rename properties to their tag property names
    if ( initParams )
        slProperties.initParams = initParams;
    if ( slProperties.isWindowless && !slProperties.windowless)
        slProperties.windowless = slProperties.isWindowless;
    if ( slProperties.framerate && !slProperties.maxFramerate)
        slProperties.maxFramerate = slProperties.framerate;
    if ( id && !slProperties.id)
        slProperties.id = id;
    
    // remove elements which are not to be added to the instantiation tag
    delete slProperties.ignoreBrowserVer;
    delete slProperties.inplaceInstallPrompt;
    delete slProperties.version;
    delete slProperties.isWindowless;
    delete slProperties.framerate;
    delete slProperties.data;
    delete slProperties.src;
    delete slProperties.alt;


    // detect that the correct version of Silverlight is installed, else display install

    if (Silverlight.isInstalled(slPluginHelper.version))
    {
        //move unknown events to the slProperties array
        for (var name in slEvents)
        {
            if ( slEvents[name])
            {
                if ( name == "onLoad" && typeof slEvents[name] == "function" && slEvents[name].length != 1 )
                {
                    var onLoadHandler = slEvents[name];
                    slEvents[name]=function (sender){ return onLoadHandler(document.getElementById(id), userContext, sender)};
                }
                var handlerName = Silverlight.__getHandlerName(slEvents[name]);
                if ( handlerName != null )
                {
                    slProperties[name] = handlerName;
                    slEvents[name] = null;
                }
                else
                {
                    throw "typeof events."+name+" must be 'function' or 'string'";
                }
            }
        }
        slPluginHTML = Silverlight.buildHTML(slProperties);
    }
    //The control could not be instantiated. Show the installation prompt
    else 
    {
        slPluginHTML = Silverlight.buildPromptHTML(slPluginHelper);
    }

    // insert or return the HTML
    if(parentElement)
    {
        parentElement.innerHTML = slPluginHTML;
    }
    else
    {
        return slPluginHTML;
    }

}

///////////////////////////////////////////////////////////////////////////////
//
//  create HTML that instantiates the control
//
///////////////////////////////////////////////////////////////////////////////
Silverlight.buildHTML = function( slProperties)
{
    var htmlBuilder = [];

    htmlBuilder.push('<object type=\"application/x-silverlight\" data="data:application/x-silverlight,"');
    if ( slProperties.id != null )
    {
        htmlBuilder.push(' id="' + slProperties.id + '"');
    }
    if ( slProperties.width != null )
    {
        htmlBuilder.push(' width="' + slProperties.width+ '"');
    }
    if ( slProperties.height != null )
    {
        htmlBuilder.push(' height="' + slProperties.height + '"');
    }
    htmlBuilder.push(' >');
    
    delete slProperties.id;
    delete slProperties.width;
    delete slProperties.height;
    
    for (var name in slProperties)
    {
        if (slProperties[name])
        {
            htmlBuilder.push('<param name="'+Silverlight.HtmlAttributeEncode(name)+'" value="'+Silverlight.HtmlAttributeEncode(slProperties[name])+'" />');
        }
    }
    htmlBuilder.push('<\/object>');
    return htmlBuilder.join('');
}




// createObjectEx, takes a single parameter of all createObject parameters enclosed in {}
Silverlight.createObjectEx = function(params)
{
    var parameters = params;
    var html = Silverlight.createObject(parameters.source, parameters.parentElement, parameters.id, parameters.properties, parameters.events, parameters.initParams, parameters.context);
    if (parameters.parentElement == null)
    {
        return html;
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Builds the HTML to prompt the user to download and install Silverlight
///////////////////////////////////////////////////////////////////////////////////////////////
Silverlight.buildPromptHTML = function(slPluginHelper)
{
    var slPluginHTML = "";
    var urlRoot = Silverlight.fwlinkRoot;
    var shortVer = slPluginHelper.version ;
    if ( slPluginHelper.alt )
    {
        slPluginHTML = slPluginHelper.alt;
    }
    else
    {
        if (! shortVer )
        {
            shortVer="";
        }
        slPluginHTML = "<a href='javascript:Silverlight.getSilverlight(\"{1}\");' style='text-decoration: none;'><img src='{2}' alt='Get Microsoft Silverlight' style='border-style: none'/></a>";
        slPluginHTML = slPluginHTML.replace('{1}', shortVer );
        slPluginHTML = slPluginHTML.replace('{2}', urlRoot + '108181');
    }
    
    return slPluginHTML;
}


Silverlight.getSilverlight = function(version)
{
    if (Silverlight.onGetSilverlight )
    {
        Silverlight.onGetSilverlight();
    }
    
    var shortVer = "";
    var reqVerArray = String(version).split(".");
    if (reqVerArray.length > 1)
    {
        var majorNum = parseInt(reqVerArray[0] );
        if ( isNaN(majorNum) || majorNum < 2 )
        {
            shortVer = "1.0";
        }
        else
        {
            shortVer = reqVerArray[0]+'.'+reqVerArray[1];
        }
    }
    
    var verArg = "";
    
    if (shortVer.match(/^\d+\056\d+$/) )
    {
        verArg = "&v="+shortVer;
    }
    
    Silverlight.followFWLink("114576" + verArg);
}


///////////////////////////////////////////////////////////////////////////////////////////////
/// Navigates to a url based on fwlinkid
///////////////////////////////////////////////////////////////////////////////////////////////
Silverlight.followFWLink = function(linkid)
{
    top.location=Silverlight.fwlinkRoot+String(linkid);
}












///////////////////////////////////////////////////////////////////////////////////////////////
/// Encodes special characters in input strings as charcodes
///////////////////////////////////////////////////////////////////////////////////////////////
Silverlight.HtmlAttributeEncode = function( strInput )
{
      var c;
      var retVal = '';

    if(strInput == null)
      {
          return null;
    }
      
      for(var cnt = 0; cnt < strInput.length; cnt++)
      {
            c = strInput.charCodeAt(cnt);

            if (( ( c > 96 ) && ( c < 123 ) ) ||
                  ( ( c > 64 ) && ( c < 91 ) ) ||
                  ( ( c > 43 ) && ( c < 58 ) && (c!=47)) ||
                  ( c == 95 ))
            {
                  retVal = retVal + String.fromCharCode(c);
            }
            else
            {
                  retVal = retVal + '&#' + c + ';';
            }
      }
      
      return retVal;
}
///////////////////////////////////////////////////////////////////////////////
//
//  Default error handling function to be used when a custom error handler is
//  not present
//
///////////////////////////////////////////////////////////////////////////////

Silverlight.default_error_handler = function (sender, args)
{
    var iErrorCode;
    var errorType = args.ErrorType;

    iErrorCode = args.ErrorCode;

    var errMsg = "\nSilverlight error message     \n" ;

    errMsg += "ErrorCode: "+ iErrorCode + "\n";


    errMsg += "ErrorType: " + errorType + "       \n";
    errMsg += "Message: " + args.ErrorMessage + "     \n";

    if (errorType == "ParserError")
    {
        errMsg += "XamlFile: " + args.xamlFile + "     \n";
        errMsg += "Line: " + args.lineNumber + "     \n";
        errMsg += "Position: " + args.charPosition + "     \n";
    }
    else if (errorType == "RuntimeError")
    {
        if (args.lineNumber != 0)
        {
            errMsg += "Line: " + args.lineNumber + "     \n";
            errMsg += "Position: " +  args.charPosition + "     \n";
        }
        errMsg += "MethodName: " + args.methodName + "     \n";
    }
    alert (errMsg);
}

///////////////////////////////////////////////////////////////////////////////////////////////
/// Releases event handler resources when the page is unloaded
///////////////////////////////////////////////////////////////////////////////////////////////
Silverlight.__cleanup = function ()
{
    for (var i = Silverlight._silverlightCount - 1; i >= 0; i--) {
        window['__slEvent' + i] = null;
    }
    Silverlight._silverlightCount = 0;
    if (window.removeEventListener) { 
       window.removeEventListener('unload', Silverlight.__cleanup , false);
    }
    else { 
        window.detachEvent('onunload', Silverlight.__cleanup );
    }
}
///////////////////////////////////////////////////////////////////////////////////////////////
/// Releases event handler resources when the page is unloaded
///////////////////////////////////////////////////////////////////////////////////////////////
Silverlight.__getHandlerName = function (handler)
{
    var handlerName = "";
    if ( typeof handler == "string")
    {
        handlerName = handler;
    }
    else if ( typeof handler == "function" )
    {
        if (Silverlight._silverlightCount == 0)
        {
            if (window.addEventListener) 
            {
                window.addEventListener('onunload', Silverlight.__cleanup , false);
            }
            else 
            {
                window.attachEvent('onunload', Silverlight.__cleanup );
            }
        }
        var count = Silverlight._silverlightCount++;
        handlerName = "__slEvent"+count;
        
        window[handlerName]=handler;
    }
    else
    {
        handlerName = null;
    }
    return handlerName;
}
// SIG // Begin signature block
// SIG // MIIbAQYJKoZIhvcNAQcCoIIa8jCCGu4CAQExCzAJBgUr
// SIG // DgMCGgUAMGcGCisGAQQBgjcCAQSgWTBXMDIGCisGAQQB
// SIG // gjcCAR4wJAIBAQQQEODJBs441BGiowAQS9NQkAIBAAIB
// SIG // AAIBAAIBAAIBADAhMAkGBSsOAwIaBQAEFM3c7Jx9fQak
// SIG // mnltLfGO2AB/TXXFoIIV8jCCBKAwggOIoAMCAQICCmEa
// SIG // 9eoAAAAAAGowDQYJKoZIhvcNAQEFBQAweTELMAkGA1UE
// SIG // BhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNV
// SIG // BAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBD
// SIG // b3Jwb3JhdGlvbjEjMCEGA1UEAxMaTWljcm9zb2Z0IENv
// SIG // ZGUgU2lnbmluZyBQQ0EwHhcNMTExMTAxMjIzOTE3WhcN
// SIG // MTMwMjAxMjI0OTE3WjCBgzELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjENMAsGA1UECxMETU9QUjEeMBwGA1UEAxMVTWljcm9z
// SIG // b2Z0IENvcnBvcmF0aW9uMIIBIjANBgkqhkiG9w0BAQEF
// SIG // AAOCAQ8AMIIBCgKCAQEAw6kfz3wjfzEeBiWJ3XV5uc+T
// SIG // S2GStpXy76olnXfzS1ptSZDM4DG4pgI3h3Sv8qygYJS4
// SIG // x04l/ofYWNIgTi3xOmUuklumXeaVdeA05VAhnH05l7aO
// SIG // RCNmFqZlIOA264r6neLLYAH8KmTIh0UU8R7KzSisuuVX
// SIG // WSbc7MVKbJrmAxopMj8AnoOsJQ2EzN1vtmq7LfeEOm1m
// SIG // Meg2cP+EkpD3QHaeiC5H1isR94/gEmUrvF/vFfz37AFo
// SIG // t0UM7sAEsA63vXhrro3kUPE14p4B0uHrW3GCYSEg89TJ
// SIG // 3hy4AkVlSb5+tTeGp83sWt+4diD8ERNR/PoqUKq0HtA6
// SIG // gL5jytyBRwIDAQABo4IBHTCCARkwEwYDVR0lBAwwCgYI
// SIG // KwYBBQUHAwMwHQYDVR0OBBYEFAADpuWixHGigsOPds0s
// SIG // DRLinUooMA4GA1UdDwEB/wQEAwIHgDAfBgNVHSMEGDAW
// SIG // gBRXRXQcXbD2yEMF4IxULY8yp/5IljBWBgNVHR8ETzBN
// SIG // MEugSaBHhkVodHRwOi8vY3JsLm1pY3Jvc29mdC5jb20v
// SIG // cGtpL2NybC9wcm9kdWN0cy9NaWNDb2RTaWdQQ0FfMDgt
// SIG // MzEtMjAxMC5jcmwwWgYIKwYBBQUHAQEETjBMMEoGCCsG
// SIG // AQUFBzAChj5odHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20v
// SIG // cGtpL2NlcnRzL01pY0NvZFNpZ1BDQV8wOC0zMS0yMDEw
// SIG // LmNydDANBgkqhkiG9w0BAQUFAAOCAQEAkPf4eZJpyI9r
// SIG // imDufMGuPoE4UvS6z5mM8C09E/Su9mHwdThOWcY/B0P5
// SIG // B3zHU+SRYtaodhR1lIZZsroQwn9sFT8ZFcMOL345w8/+
// SIG // VCdYlDVhB3ltUVewEuHqY3KKFmbrnzkqMwQ1i4PeCl4x
// SIG // vJ8d7jVFDV3Hl98q4J1/Okn740hFMt82bQludlVVrDTF
// SIG // eV1uAtXMl4nzqGh9FOppewtVfQKMxE0wvGL3e6XsoJLw
// SIG // DioOr1ebKUjNtiGl6h3v3An1q2LWDew1X2uZ1LHwd1L5
// SIG // d+k/bJhWwFw2oU5eEPSMehGXICAxCHluchZfHDBXm8t8
// SIG // olX1cGx47KFDIK7ssDWLGDCCBLowggOioAMCAQICCmEF
// SIG // EzYAAAAAABowDQYJKoZIhvcNAQEFBQAwdzELMAkGA1UE
// SIG // BhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNV
// SIG // BAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBD
// SIG // b3Jwb3JhdGlvbjEhMB8GA1UEAxMYTWljcm9zb2Z0IFRp
// SIG // bWUtU3RhbXAgUENBMB4XDTExMDcyNTIwNDIxN1oXDTEy
// SIG // MTAyNTIwNDIxN1owgbMxCzAJBgNVBAYTAlVTMRMwEQYD
// SIG // VQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25k
// SIG // MR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24x
// SIG // DTALBgNVBAsTBE1PUFIxJzAlBgNVBAsTHm5DaXBoZXIg
// SIG // RFNFIEVTTjoxNTlDLUEzRjctMjU3MDElMCMGA1UEAxMc
// SIG // TWljcm9zb2Z0IFRpbWUtU3RhbXAgU2VydmljZTCCASIw
// SIG // DQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAJw0mBnJ
// SIG // CSljmQIWdaiIV32hu6lBEvxkkaXWBXi/d9zs5q64UE7A
// SIG // 4xq97bf9+CCKcTmqcpJyn4oJ5RPvkUHtYSVrUa3uqEO1
// SIG // YUIsnfIdsdL8t/V7o3N2E7Mro9uUYYBVoQ9t3djsFv+F
// SIG // f5aeiH8ALo56JLponY/GyvSQeXrhm+8GXX74LsNqFZw8
// SIG // FC/n1ZTIIhtRy6lVhiG3WvNBEjmf8FWpTqolK2P7kXI8
// SIG // D3zAlnLcwaPBCMrexcm1wApfpZwLqnIKXQpAfS6Y0Kuy
// SIG // iI+GgOh90b5Va+BYLMg2P/nmEcPwQwWFeAMX5SynKXzT
// SIG // 4pUXAGzb3K08GToC4H1i1M72HT0CAwEAAaOCAQkwggEF
// SIG // MB0GA1UdDgQWBBT2g4sghxHug8vb3oWi0miGN2F0kDAf
// SIG // BgNVHSMEGDAWgBQjNPjZUkZwCu1A+3b7syuwwzWzDzBU
// SIG // BgNVHR8ETTBLMEmgR6BFhkNodHRwOi8vY3JsLm1pY3Jv
// SIG // c29mdC5jb20vcGtpL2NybC9wcm9kdWN0cy9NaWNyb3Nv
// SIG // ZnRUaW1lU3RhbXBQQ0EuY3JsMFgGCCsGAQUFBwEBBEww
// SIG // SjBIBggrBgEFBQcwAoY8aHR0cDovL3d3dy5taWNyb3Nv
// SIG // ZnQuY29tL3BraS9jZXJ0cy9NaWNyb3NvZnRUaW1lU3Rh
// SIG // bXBQQ0EuY3J0MBMGA1UdJQQMMAoGCCsGAQUFBwMIMA0G
// SIG // CSqGSIb3DQEBBQUAA4IBAQBi9AUNT+cba4LnUgzfeYyo
// SIG // VYEzl9Okysn+r0jbe9pveihPx9C3idjRppnMkVYAOzjo
// SIG // tzIv7vnPa9mY3tYC9UJYUmuO2kDcFqCz1L8mFctIQszT
// SIG // /bT65ESJZg9CDl73BJ8jSFu0iUHE2mz4NvQ/wh4V35hM
// SIG // AMSy7N5fAQFDnLhC1iLIk5qeyaUYZ/xHhB6RXZvydvex
// SIG // jnIdgHY8NhFGyn46SPOv40n2FzONuwBjgpxXo1anw26Q
// SIG // oz6Vt/xk0V0YwgsBUGOn/PPRgJ6E4zI03VeVQKNtftrr
// SIG // LloItBAGXjLJCekygnEWp/rGr2aYifnZnrVfECOjd4Dy
// SIG // TdYoAHJQhbzlMIIGBzCCA++gAwIBAgIKYRZoNAAAAAAA
// SIG // HDANBgkqhkiG9w0BAQUFADBfMRMwEQYKCZImiZPyLGQB
// SIG // GRYDY29tMRkwFwYKCZImiZPyLGQBGRYJbWljcm9zb2Z0
// SIG // MS0wKwYDVQQDEyRNaWNyb3NvZnQgUm9vdCBDZXJ0aWZp
// SIG // Y2F0ZSBBdXRob3JpdHkwHhcNMDcwNDAzMTI1MzA5WhcN
// SIG // MjEwNDAzMTMwMzA5WjB3MQswCQYDVQQGEwJVUzETMBEG
// SIG // A1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
// SIG // ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MSEwHwYDVQQDExhNaWNyb3NvZnQgVGltZS1TdGFtcCBQ
// SIG // Q0EwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIB
// SIG // AQCfoWyx39tIkip8ay4Z4b3i48WZUSNQrc7dGE4kD+7R
// SIG // p9FMrXQwIBHrB9VUlRVJlBtCkq6YXDAm2gBr6Hu97IkH
// SIG // D/cOBJjwicwfyzMkh53y9GccLPx754gd6udOo6HBI1PK
// SIG // jfpFzwnQXq/QsEIEovmmbJNn1yjcRlOwhtDlKEYuJ6yG
// SIG // T1VSDOQDLPtqkJAwbofzWTCd+n7Wl7PoIZd++NIT8wi3
// SIG // U21StEWQn0gASkdmEScpZqiX5NMGgUqi+YSnEUcUCYKf
// SIG // hO1VeP4Bmh1QCIUAEDBG7bfeI0a7xC1Un68eeEExd8yb
// SIG // 3zuDk6FhArUdDbH895uyAc4iS1T/+QXDwiALAgMBAAGj
// SIG // ggGrMIIBpzAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQW
// SIG // BBQjNPjZUkZwCu1A+3b7syuwwzWzDzALBgNVHQ8EBAMC
// SIG // AYYwEAYJKwYBBAGCNxUBBAMCAQAwgZgGA1UdIwSBkDCB
// SIG // jYAUDqyCYEBWJ5flJRP8KuEKU5VZ5KShY6RhMF8xEzAR
// SIG // BgoJkiaJk/IsZAEZFgNjb20xGTAXBgoJkiaJk/IsZAEZ
// SIG // FgltaWNyb3NvZnQxLTArBgNVBAMTJE1pY3Jvc29mdCBS
// SIG // b290IENlcnRpZmljYXRlIEF1dGhvcml0eYIQea0WoUqg
// SIG // pa1Mc1j0BxMuZTBQBgNVHR8ESTBHMEWgQ6BBhj9odHRw
// SIG // Oi8vY3JsLm1pY3Jvc29mdC5jb20vcGtpL2NybC9wcm9k
// SIG // dWN0cy9taWNyb3NvZnRyb290Y2VydC5jcmwwVAYIKwYB
// SIG // BQUHAQEESDBGMEQGCCsGAQUFBzAChjhodHRwOi8vd3d3
// SIG // Lm1pY3Jvc29mdC5jb20vcGtpL2NlcnRzL01pY3Jvc29m
// SIG // dFJvb3RDZXJ0LmNydDATBgNVHSUEDDAKBggrBgEFBQcD
// SIG // CDANBgkqhkiG9w0BAQUFAAOCAgEAEJeKw1wDRDbd6bSt
// SIG // d9vOeVFNAbEudHFbbQwTq86+e4+4LtQSooxtYrhXAstO
// SIG // IBNQmd16QOJXu69YmhzhHQGGrLt48ovQ7DsB7uK+jwoF
// SIG // yI1I4vBTFd1Pq5Lk541q1YDB5pTyBi+FA+mRKiQicPv2
// SIG // /OR4mS4N9wficLwYTp2OawpylbihOZxnLcVRDupiXD8W
// SIG // mIsgP+IHGjL5zDFKdjE9K3ILyOpwPf+FChPfwgphjvDX
// SIG // uBfrTot/xTUrXqO/67x9C0J71FNyIe4wyrt4ZVxbARcK
// SIG // FA7S2hSY9Ty5ZlizLS/n+YWGzFFW6J1wlGysOUzU9nm/
// SIG // qhh6YinvopspNAZ3GmLJPR5tH4LwC8csu89Ds+X57H21
// SIG // 46SodDW4TsVxIxImdgs8UoxxWkZDFLyzs7BNZ8ifQv+A
// SIG // eSGAnhUwZuhCEl4ayJ4iIdBD6Svpu/RIzCzU2DKATCYq
// SIG // SCRfWupW76bemZ3KOm+9gSd0BhHudiG/m4LBJ1S2sWo9
// SIG // iaF2YbRuoROmv6pH8BJv/YoybLL+31HIjCPJZr2dHYcS
// SIG // ZAI9La9Zj7jkIeW1sMpjtHhUBdRBLlCslLCleKuzoJZ1
// SIG // GtmShxN1Ii8yqAhuoFuMJb+g74TKIdbrHk/Jmu5J4PcB
// SIG // ZW+JC33Iacjmbuqnl84xKf8OxVtc2E0bodj6L54/LlUW
// SIG // a8kTo/0wggaBMIIEaaADAgECAgphFQgnAAAAAAAMMA0G
// SIG // CSqGSIb3DQEBBQUAMF8xEzARBgoJkiaJk/IsZAEZFgNj
// SIG // b20xGTAXBgoJkiaJk/IsZAEZFgltaWNyb3NvZnQxLTAr
// SIG // BgNVBAMTJE1pY3Jvc29mdCBSb290IENlcnRpZmljYXRl
// SIG // IEF1dGhvcml0eTAeFw0wNjAxMjUyMzIyMzJaFw0xNzAx
// SIG // MjUyMzMyMzJaMHkxCzAJBgNVBAYTAlVTMRMwEQYDVQQI
// SIG // EwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4w
// SIG // HAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xIzAh
// SIG // BgNVBAMTGk1pY3Jvc29mdCBDb2RlIFNpZ25pbmcgUENB
// SIG // MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
// SIG // n43fhTeMsQZWZjZO1ArrNiORHq+rjVjpxM/BnzoKJMTE
// SIG // xF6w7hUUxfo+mTNrGWly9HwFX+WZJUTXNRmKkNwojpAM
// SIG // 79WQYa3e3BhwLYPJb6+FLPjdubkw/XF4HIP9yKm5gmcN
// SIG // erjBCcK8FpdXPxyY02nXMJCQkI0wH9gm1J57iNniCe2X
// SIG // SUXrBFKBdXu4tSK4Lla718+pTjwKg6KoOsWttgEOas8i
// SIG // tCMfbNUn57d+wbTVMq15JRxChuKdhfRX2htZLy0mkinF
// SIG // s9eFo55gWpTme5x7XoI0S23/1O4n0KLc0ZAMzn0OFXyI
// SIG // rDTHwGyYhErJRHloKN8igw24iixIYeL+EQIDAQABo4IC
// SIG // IzCCAh8wEAYJKwYBBAGCNxUBBAMCAQAwHQYDVR0OBBYE
// SIG // FFdFdBxdsPbIQwXgjFQtjzKn/kiWMAsGA1UdDwQEAwIB
// SIG // xjAPBgNVHRMBAf8EBTADAQH/MIGYBgNVHSMEgZAwgY2A
// SIG // FA6sgmBAVieX5SUT/CrhClOVWeSkoWOkYTBfMRMwEQYK
// SIG // CZImiZPyLGQBGRYDY29tMRkwFwYKCZImiZPyLGQBGRYJ
// SIG // bWljcm9zb2Z0MS0wKwYDVQQDEyRNaWNyb3NvZnQgUm9v
// SIG // dCBDZXJ0aWZpY2F0ZSBBdXRob3JpdHmCEHmtFqFKoKWt
// SIG // THNY9AcTLmUwUAYDVR0fBEkwRzBFoEOgQYY/aHR0cDov
// SIG // L2NybC5taWNyb3NvZnQuY29tL3BraS9jcmwvcHJvZHVj
// SIG // dHMvbWljcm9zb2Z0cm9vdGNlcnQuY3JsMFQGCCsGAQUF
// SIG // BwEBBEgwRjBEBggrBgEFBQcwAoY4aHR0cDovL3d3dy5t
// SIG // aWNyb3NvZnQuY29tL3BraS9jZXJ0cy9NaWNyb3NvZnRS
// SIG // b290Q2VydC5jcnQwdgYDVR0gBG8wbTBrBgkrBgEEAYI3
// SIG // FS8wXjBcBggrBgEFBQcCAjBQHk4AQwBvAHAAeQByAGkA
// SIG // ZwBoAHQAIACpACAAMgAwADAANgAgAE0AaQBjAHIAbwBz
// SIG // AG8AZgB0ACAAQwBvAHIAcABvAHIAYQB0AGkAbwBuAC4w
// SIG // EwYDVR0lBAwwCgYIKwYBBQUHAwMwDQYJKoZIhvcNAQEF
// SIG // BQADggIBADC8sCCkYqCn7zkmYT3crMaZ0IbELvWDMmVe
// SIG // Ij6b1ob46LafyovWO3ULoZE+TN1kdIxJ8oiMGGds/hVm
// SIG // Rrg6RkKXyJE31CSx56zT6kEUg3fTyU8FX6MUUr+WpC8+
// SIG // VlsQdc5Tw84FVGm0ZckkpQ/hJbgauU3lArlQHk+zmAwd
// SIG // lQLuIlmtIssFdAsERXsEWeDYD7PrTPhg3cJ4ntG6n2v3
// SIG // 8+5+RBFA0r26m0sWCG6kvlXkpjgSo0j0HFV6iiDRff6R
// SIG // 25SPL8J7a6ZkhU+j5Sw0KV0Lv/XHOC/EIMRWMfZpzoX4
// SIG // CpHs0NauujgFDOtuT0ycAymqovwYoCkMDVxcViNX2hyW
// SIG // DcgmNsFEy+Xh5m+J54/pmLVz03jj7aMBPHTlXrxs9iGJ
// SIG // ZwXsl521sf2vpulypcM04S+f+fRqOeItBIJb/NCcrnyd
// SIG // EfnmtVMZdLo5SjnrfUKzSjs3PcJKeyeY5+JOmxtKVDhq
// SIG // Ize+ardI7upCDUkkkY63BC6Xb+TnRbuPTf1g2ddZwtiA
// SIG // 1mA0e7ehkyD+gbiqpVwJ6YoNvihNftfoD+1leNExX7lm
// SIG // 299C5wvMAgeN3/8gBqNFZbSzMo0ukeJNtKnJ+rxrBA6y
// SIG // n+qf3qTJCpb0jffYmKjwhQIIWaQgpiwLGvJSBu1p5WQY
// SIG // G+Cjq97KfBRhQ7hl9TajVRMrZyxNGzBMMYIEezCCBHcC
// SIG // AQEwgYcweTELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldh
// SIG // c2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNV
// SIG // BAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEjMCEGA1UE
// SIG // AxMaTWljcm9zb2Z0IENvZGUgU2lnbmluZyBQQ0ECCmEa
// SIG // 9eoAAAAAAGowCQYFKw4DAhoFAKCBqDAZBgkqhkiG9w0B
// SIG // CQMxDAYKKwYBBAGCNwIBBDAcBgorBgEEAYI3AgELMQ4w
// SIG // DAYKKwYBBAGCNwIBFTAjBgkqhkiG9w0BCQQxFgQU5ePS
// SIG // pk/8JDPej5zgoplJar6hvIgwSAYKKwYBBAGCNwIBDDE6
// SIG // MDigHoAcAFMAaQBsAHYAZQByAGwAaQBnAGgAdAAuAGoA
// SIG // c6EWgBRodHRwOi8vbWljcm9zb2Z0LmNvbTANBgkqhkiG
// SIG // 9w0BAQEFAASCAQCYICIeYrnu78E+MKd6MbB4qh2ikHHv
// SIG // l0MHhz85Wa8cmMcjr1VItFnv3Q4TcQLJDompfXUahEKd
// SIG // aSwtTTIPldcsvdxa2qi8aVD5ZlG5Ksx0xe92LEf6patS
// SIG // MU4Kcn+yvT469mYiNx/iV3anD2YqoCJkoO42x2kavY9k
// SIG // GD8p6dXD3Nh4Vgxd6ZcsWrQxbUmtmwzSMCUWbcNrhmRj
// SIG // tUaxZuAHrjN+bq9ei38NTCoYQ/FOCb1sy82LNBaghW5Q
// SIG // hiO3qAoyIu/PIXPNFbGZHPiFr3oxu42139j9xkBSA1he
// SIG // uvRCNPP2GuBAg+hYz6VIMtZH+1VJSv2lW81MFMH8YXll
// SIG // TNgxoYICHTCCAhkGCSqGSIb3DQEJBjGCAgowggIGAgEB
// SIG // MIGFMHcxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNo
// SIG // aW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQK
// SIG // ExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xITAfBgNVBAMT
// SIG // GE1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQQIKYQUTNgAA
// SIG // AAAAGjAHBgUrDgMCGqBdMBgGCSqGSIb3DQEJAzELBgkq
// SIG // hkiG9w0BBwEwHAYJKoZIhvcNAQkFMQ8XDTEyMDIxNDEx
// SIG // MjI0NlowIwYJKoZIhvcNAQkEMRYEFPVx7JaiprSeRt4l
// SIG // RZPGxN4t5jqmMA0GCSqGSIb3DQEBBQUABIIBAHO3YZj2
// SIG // 0cz662kqSHN7MG0/4w7Z3sd2ngD2SJSkKzZqDkTZfcgv
// SIG // etOYG9L+joyvC8T9G3ffZbnmXIkfcsk520kTSHvUnX/f
// SIG // jdWYkD8iU4SHQM3m3IqDei1K0Vso5TgkoF4Jyr+eHP3r
// SIG // aQx0F2x6kQ0SPjso5gNh6F/Uv9YcBk5cQNQd1MlDhSFw
// SIG // u7Hb8xYU1zI/dyD9IEVw/XbKPGDoJIsBId8Mf/mr52BT
// SIG // yaBvxg5tR8cg84IKEo+K18elkLPzMlcDIuWtgdA1Ac5l
// SIG // tdxq1ZiptCKmnSlfkFcWn37PeRJUKqlxmCH8NRmxOPTc
// SIG // AEmIjaX/6/6bqGpBBdKv8uTxMf4=
// SIG // End signature block
