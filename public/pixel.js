// Meta-pixel, kun efter samtykke. Sæt PIXEL_ID for at slå den til.
(function(){
  var PIXEL_ID = '1089683803957398';
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
    d.innerHTML = '<span style="flex:1 1 auto">Vi bruger cookies. <a href="/cookies" style="color:#17734F">Læs mere</a></span>'
      + '<button type="button" data-v="yes">Accepter</button><button type="button" data-v="no">Afvis</button>';
    d.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:60;max-width:440px;margin:0 auto;display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:#FFFFFF;border-radius:14px;padding:10px 12px;box-shadow:0 8px 28px -10px rgba(23,38,43,.4);font:600 14px Nunito,system-ui,sans-serif;color:#3A484D';
    [].forEach.call(d.querySelectorAll('button'), function(b){
      b.style.cssText = 'min-height:36px;padding:0 14px;border-radius:10px;font:800 14px Nunito,system-ui,sans-serif;cursor:pointer;border:2px solid #17734F;' + (b.dataset.v === 'yes' ? 'background:#17734F;color:#FFFFFF' : 'background:#FFFFFF;color:#17734F');
      b.addEventListener('click', function(){ set(b.dataset.v); d.remove(); if (b.dataset.v === 'yes') load(); });
    });
    document.body.appendChild(d);
  }
  window.nsCookies = function(){ var x = document.getElementById('ns-ck'); if (x) x.remove(); banner(); };
  var v = get();
  if (v === 'yes') load(); else if (v !== 'no') banner();
})();
