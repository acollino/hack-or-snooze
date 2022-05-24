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
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  let starType;
  currentUser.isFavoriteStory(story.storyId)
    ? (starType = '"far fa-star fa"')
    : (starType = '"far fa-star"');
  return $(`
      <li id="${story.storyId}">
        <i class=${starType}></i>
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
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

$("#submit-story-button").on("click", (evt) => {
  evt.preventDefault();
  addSubmittedStory();
});

$allStoriesList.on("click", "i", (evt) => {
  $(evt.target).toggleClass("fa");
  User.toggleStoryAsFavorite($(evt.target).parent().attr("id"));
});
