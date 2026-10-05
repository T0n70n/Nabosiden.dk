// Meta-pixel, kun efter samtykke. Sæt PIXEL_ID for at slå den til.
(function(){
  var PIXEL_ID = '';
  var KEY = 'ns-cookies';
  if (!PIXEL_ID) return;
  function get(){ try { return localStorage.getItem(KEY); } catch(e){ return null; } }
  function set(v){ try { localStorage.setItem(KEY, v); } catch(e){} }
  var queue = [];
  window.nsLead = function(kind){ if (window.fbq) fbq('track', 'Lead', {content_name: kind || ''}); else queue.push(kind); };
  function load(){
    if (window.fbq) return;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', PIXEL_ID); fbq('track', 'PageView');
    queue.splice(0).forEach(function(k){ fbq('track', 'Lead', {content_name: k || ''}); });
  }
  function banner(){
    if (document.getElementById('ns-ck')) return;
    var d = document.createElement('div');
    d.id = 'ns-ck'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Cookies');
    d.innerHTML = '<p style="margin:0 0 6px;font-size:19px;font-weight:900;color:#17262B">Må vi måle vores annoncer?</p>'
      + '<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#3A484D">Siger du ja, sætter vi en cookie fra Meta (Facebook), så vi kan se, om vores annoncer virker. Du kan altid ændre dit valg under <a href="/cookies" style="color:#17734F">Cookies</a>.</p>'
      + '<div style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" data-v="yes">Ja tak</button><button type="button" data-v="no">Nej tak</button></div>';
    d.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:60;max-width:520px;margin:0 auto;background:#FFFFFF;border-radius:22px;padding:22px;box-shadow:0 16px 48px -12px rgba(23,38,43,.45);font-family:Nunito,system-ui,sans-serif';
    [].forEach.call(d.querySelectorAll('button'), function(b){
      b.style.cssText = 'flex:1 1 140px;min-height:52px;border-radius:14px;font:800 17px Nunito,system-ui,sans-serif;cursor:pointer;border:2px solid #17734F;' + (b.dataset.v === 'yes' ? 'background:#17734F;color:#FFFFFF' : 'background:#FFFFFF;color:#17734F');
      b.addEventListener('click', function(){ set(b.dataset.v); d.remove(); if (b.dataset.v === 'yes') load(); });
    });
    document.body.appendChild(d);
  }
  window.nsCookies = function(){ var x = document.getElementById('ns-ck'); if (x) x.remove(); banner(); };
  var v = get();
  if (v === 'yes') load(); else if (v !== 'no') banner();
})();
