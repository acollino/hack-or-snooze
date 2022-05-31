"use strict";

/******************************************************************************
 * Handling navbar clicks and updating navbar
 */

/** Show main list of all stories when click site name */

function navAllStories(evt) {
  hidePageComponents(); //defined in main.js
  putStoriesOnPage(); //defined in stories.js
}

$body.on("click", "#nav-all", navAllStories);

function navFavorites(evt) {
  hidePageComponents();
  putFavoritesOnPage(); //defined in stories.js
}

$body.on("click", "#nav-favorites", navFavorites);

function navUserStories(evt) {
  hidePageComponents();
  putUserStoriesOnPage(); //defined in stories.js
}

$body.on("click", "#nav-my-stories", navUserStories);

function navHidden(evt) {
  hidePageComponents();
  putHiddenStoriesOnPage(); //defined in stories.js
}

$body.on("click", "#nav-hidden-stories", navHidden);

$body.on("click", "#nav-submit", () => $("#submit-story-form").toggle());

/** Show login/signup on click on "login" */

function navLoginClick(evt) {
  console.debug("navLoginClick", evt);
  hidePageComponents();
  $loginForm.show();
  $signupForm.show();
}

$navLogin.on("click", navLoginClick);

/** When a user first logins in, update the navbar to reflect that. */

function updateNavOnLogin() {
  console.debug("updateNavOnLogin");
  $(".main-nav-links").show();
  if (currentUser.hidden.length) {
    $("#nav-hidden-stories-container").show();
  }
  $navLogin.hide();
  $navLogOut.show();
  $navUserProfile.text(`${currentUser.username}`).show();
}
