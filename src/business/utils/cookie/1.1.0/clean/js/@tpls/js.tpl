<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="HandheldFriendly" content="true">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="format-detection" content="telephone=no" />
<script type="text/javascript">
(function(){
    var el = document.createElement("p");
    var cookies = {cookies};
    var expires = (new Date(-1)).toUTCString();
    var len = 0;
    if (cookies && cookies.length) {
        cookies.forEach(item => {
            if (item) {
                document.cookie = item + "=''; path=/;expires=" + expires;
                len += 1;
            }
        });
    }
    el.innerHTML = "Clean " + len;
    setTimeout(function(){
        document.body.append(el);
        el = null;
    }, 100)
})()
</script>
</head>
<body>
</body>
</html>
