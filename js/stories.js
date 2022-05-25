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

function generateStoryMarkup(story, showHidden = false) {
  const hostName = story.getHostName();
  let { icons, userStyle, hidden } = generateStoryStyles(story, showHidden);
  return $(`
      <li id="${story.storyId}" ${hidden}>
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

function generateStoryStyles(story, showHidden = false) {
  let starType;
  currentUser && currentUser.isFavoriteStory(story.storyId)
    ? (starType = `<i class="far fa-star fa"></i>`)
    : (starType = `<i class="far fa-star"></i>`);
  let hidden = "";
  if (!showHidden && currentUser && currentUser.isHiddenStory(story.storyId)) {
    hidden = `style="display: none"`;
  }
  let userStyle;
  let trash = "";
  if (currentUser && currentUser.username === story.username) {
    userStyle = `posted by <b><i>${story.username}</i></b>`;
    trash = `<i class="far fa-trash-alt"></i>`;
  } else {
    userStyle = `posted by ${story.username}`;
  }
  let eye;
  showHidden
    ? (eye = `<i class="far fa-eye"></i>`)
    : (eye = `<i class="far fa-eye-slash"></i>`);
  return {
    icons: `${starType} ${eye} ${trash}`,
    userStyle,
    hidden,
  };
}

function showStoriesFromCategory(emptyMessage, storyCategory = "") {
  $allStoriesList.empty();
  let storyContainer;
  storyCategory === ""
    ? (storyContainer = storyList.stories)
    : (storyContainer = currentUser[storyCategory]);
  if (storyContainer.length === 0) {
    $allStoriesList.text(emptyMessage);
  } else {
    for (let story of storyContainer) {
      let $story;
      storyCategory === "hidden"
        ? ($story = generateStoryMarkup(new Story(story), true))
        : ($story = generateStoryMarkup(new Story(story)));
      $allStoriesList.append($story);
    }
  }
  $allStoriesList.show();
}

function putStoriesOnPage() {
  showStoriesFromCategory("No stories left to show you!");
}

function putFavoritesOnPage() {
  showStoriesFromCategory("You have no favorites yet!", "favorites");
}

function putUserStoriesOnPage() {
  showStoriesFromCategory(
    "You have not submitted any stories yet!",
    "ownStories"
  );
}

function putHiddenStoriesOnPage() {
  showStoriesFromCategory("You have not hidden any stories yet!", "hidden");
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

function addToHidden(storyID) {
  let hiddenStory = storyList.getStory(storyID);
  currentUser.hidden.splice(0, 0, hiddenStory);
  localStorage.setItem("hidden", JSON.stringify(currentUser.hidden));
}

function removeFromHidden(storyID) {
  let hiddenStory = storyList.getStory(storyID);
  let storyIndex = currentUser.hidden.indexOf(hiddenStory);
  currentUser.hidden.splice(storyIndex, 1);
  localStorage.setItem("hidden", JSON.stringify(currentUser.hidden));
}

$("#submit-story-button").on("click", (evt) => {
  evt.preventDefault();
  addSubmittedStory();
});

$allStoriesList.on("click", "i.fa-star", (evt) => {
  if (currentUser) {
    $(evt.target).toggleClass("fa");
    User.toggleStoryAsFavorite($(evt.target).parent().attr("id"));
  }
});

$allStoriesList.on("click", "i.fa-eye-slash", (evt) => {
  let storyID = $(evt.target).parent().attr("id").trim();
  addToHidden(storyID);
  $(evt.target).parent().hide();
  $("#nav-hidden-stories-container").show();
});

$allStoriesList.on("click", "i.fa-eye", (evt) => {
  let storyID = $(evt.target).parent().attr("id").trim();
  removeFromHidden(storyID);
  $(evt.target).parent().hide();
  if (currentUser.hidden.length === 0) {
    $("#nav-hidden-stories-container").hide();
    putStoriesOnPage();
  }
});
