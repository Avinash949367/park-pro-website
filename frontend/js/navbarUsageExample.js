/*
Example usage of getNavbarHTML function in an HTML page:

1. Add a container element in your HTML where you want the navbar to appear:
   <div id="navbarContainer"></div>

2. Include the navbar.js script as a module:
   <script type="module" src="js/navbar.js"></script>

3. Add a script to import the function and inject the navbar:
   <script type="module">
     import { getNavbarHTML } from './js/navbar.js';
     document.getElementById('navbarContainer').innerHTML = getNavbarHTML();
   </script>

This will dynamically insert the navbar HTML into the container.
*/
