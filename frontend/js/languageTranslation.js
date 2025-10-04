function googleTranslateElementInit() {
  new google.translate.TranslateElement({
    pageLanguage: 'en',
    includedLanguages: 'en,hi,te,ta,fr,es',
    layout: google.translate.TranslateElement.InlineLayout.SIMPLE
  }, 'google_translate_element');

  // Hide Google icon and down arrow after widget loads
  setTimeout(function() {
    var style = document.createElement('style');
    style.textContent = `
      #google_translate_element img[src*="google"],
      #google_translate_element .goog-te-gadget-icon,
      #google_translate_element .goog-te-gadget-simple .goog-te-menu-value span[style*="background"],
      #google_translate_element .goog-te-gadget-simple .goog-te-menu-value img,
      #google_translate_element .goog-te-gadget-simple .goog-te-menu-value span[style*="background-image"] {
        display: none !important;
      }
      #google_translate_element .goog-te-gadget-simple .goog-te-menu-value {
        border: none !important;
        background: none !important;
        padding: 0 !important;
      }
      #google_translate_element .goog-te-gadget-simple .goog-te-menu-value:before {
        content: "🌐 Language";
        font-size: 14px;
        color: #333;
        font-weight: 500;
      }
    `;
    document.head.appendChild(style);
  }, 1000);
}

(function(){
  var s = document.createElement('script');
  s.type = 'text/javascript';
  s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  s.async = true;
  document.head.appendChild(s);
})();
