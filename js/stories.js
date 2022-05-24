"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  const hostName = story.getHostName();
  let { icons, userStyle } = generateStoryStyles(story);
  return $(`
      <li id="${story.storyId}">
        ${icons}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">${userStyle}</small>
      </li>
    `);
}

function generateStoryStyles(story) {
  let starType;
  currentUser.isFavoriteStory(story.storyId)
    ? (starType = `<i class="far fa-star fa"></i>`)
    : (starType = `<i class="far fa-star"></i>`);
  let userStyle;
  let trashType = "";
  if (currentUser.username === story.username) {
    userStyle = `posted by <b><i>${story.username}</i></b>`;
    trashType = `<i class="far fa-trash-alt"></i>`;
  } else {
    userStyle = `posted by ${story.username}`;
  }
  let eyeType = `<i class="far fa-eye-slash"></i>`;
  return {
    icons: `${starType} ${eyeType} ${trashType}`,
    userStyle
  };
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

function putFavoritesOnPage() {
  $allStoriesList.empty();
  if (currentUser.favorites.length === 0) {
    $allStoriesList.text("No favorite stories to show!");
  } else {
    for (let story of currentUser.favorites) {
      const $story = generateStoryMarkup(new Story(story));
      $allStoriesList.append($story);
    }
  }
}

async function addSubmittedStory() {
  const $storyForm = $("#submit-story-form");
  let storyInput = {
    author: $("#story-author").val(),
    title: $("#story-title").val(),
    url: $("#story-url").val(),
  };
  if (!checkInputValidity($storyForm)) {
    return;
  }
  try {
    let newStory = await storyList.addStory(currentUser, storyInput);
    $allStoriesList.prepend(generateStoryMarkup(newStory));
    $storyForm.find("input").val("");
    $storyForm.hide();
  } catch (error) {
    console.log(error);
  }
}

function checkInputValidity($form) {
  let inputElementArray = $form.find("input").get();
  return inputElementArray.every((element) => {
    return element.reportValidity();
  });
}

function putUserStoriesOnPage() {
  $allStoriesList.empty();
  if (currentUser.ownStories.length === 0) {
    $allStoriesList.text("You haven't submitted any stories yet!");
  } else {
    for (let story of currentUser.ownStories) {
      const $story = generateStoryMarkup(new Story(story));
      $allStoriesList.append($story);
    }
  }
}

$("#submit-story-button").on("click", (evt) => {
  evt.preventDefault();
  addSubmittedStory();
});

$allStoriesList.on("click", "i.fa-star", (evt) => {
  $(evt.target).toggleClass("fa");
  User.toggleStoryAsFavorite($(evt.target).parent().attr("id"));
});
