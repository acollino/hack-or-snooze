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
  if (!currentUser) {
    return {
      icons: "",
      userStyle: `posted by ${story.username}`,
      hidden: "",
    };
  }
  let starType = currentUser.isFavoriteStory(story.storyId)
    ? `<i class="far fa-star fa"></i>`
    : `<i class="far fa-star"></i>`;
  let hidden = "";
  let storyShouldBeHidden =
    !showHidden && currentUser.isHiddenStory(story.storyId);
  if (storyShouldBeHidden) {
    hidden = `style="display: none"`;
  }
  let userStyle;
  let trash = "";
  if (currentUser.username === story.username) {
    userStyle = `posted by <b><i>${story.username}</i></b>`;
    trash = `<i class="far fa-trash-alt"></i>`;
  } else {
    userStyle = `posted by ${story.username}`;
  }
  let eye = showHidden
    ? `<i class="far fa-eye"></i>`
    : `<i class="far fa-eye-slash"></i>`;
  return {
    icons: `${starType} ${eye} ${trash}`,
    userStyle,
    hidden,
  };
}

function showStoriesFromCategory(storyCategory = "") {
  $allStoriesList.empty();
  let storyContainer =
    storyCategory === "" ? storyList.stories : currentUser[storyCategory];
  for (let story of storyContainer) {
    let $storyLI =
      storyCategory === "hidden"
        ? generateStoryMarkup(new Story(story), true)
        : generateStoryMarkup(new Story(story));
    $allStoriesList.append($storyLI);
  }
  $allStoriesList.show();
  if (pageAppearsEmpty()) {
    displayEmptyMessage();
  }
}

function putStoriesOnPage() {
  storyList.currentDisplay = "nav-all";
  showStoriesFromCategory();
}

function putFavoritesOnPage() {
  storyList.currentDisplay = "nav-favorites";
  showStoriesFromCategory("favorites");
}

function putUserStoriesOnPage() {
  storyList.currentDisplay = "nav-my-stories";
  showStoriesFromCategory("ownStories");
}

function putHiddenStoriesOnPage() {
  storyList.currentDisplay = "nav-hidden-stories";
  showStoriesFromCategory("hidden");
}

async function addSubmittedStory() {
  const $storyForm = $("#submit-story-form");
  let storyInput = {
    author: $("#story-author").val(),
    title: $("#story-title").val(),
    url: $("#story-url").val(),
  };
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
  let storyIndex = currentUser.getIndexOfStory("hidden", storyID);
  currentUser.hidden.splice(storyIndex, 1);
  localStorage.setItem("hidden", JSON.stringify(currentUser.hidden));
}

function pageAppearsEmpty() {
  let numVisibleStories = $allStoriesList
    .children()
    .not('li[style*="display: none"]').length;
  return numVisibleStories === 0;
}

function displayEmptyMessage() {
  if (storyList.currentDisplay === "nav-all") {
    $allStoriesList.text("No stories left to show you!");
  }
  if (storyList.currentDisplay === "nav-favorites") {
    $allStoriesList.text("You don't have any favorites!");
  }
  if (storyList.currentDisplay === "nav-my-stories") {
    $allStoriesList.text("You have not submitted any stories!");
  }
  if (storyList.currentDisplay === "nav-hidden-stories") {
    $allStoriesList.text("You don't have any hidden stories!");
  }
}

$("#submit-story-button").on("click", (evt) => {
  evt.preventDefault();
  if (!checkInputValidity($("#submit-story-form"))) {
    return;
  }
  putStoriesOnPage();
  addSubmittedStory();
});

$allStoriesList.on("click", "i.fa-star", (evt) => {
  if (currentUser) {
    $(evt.target).toggleClass("fa");
    User.toggleStoryAsFavorite($(evt.target).parent().attr("id"));
  }
});

$allStoriesList.on("click", "i.fa-eye-slash", (evt) => {
  if (currentUser) {
    let storyID = $(evt.target).parent().attr("id").trim();
    addToHidden(storyID);
    $(evt.target).parent().hide();
    $("#nav-hidden-stories-container").show();
    if (pageAppearsEmpty()) {
      displayEmptyMessage();
    }
  }
});

$allStoriesList.on("click", "i.fa-eye", (evt) => {
  if (currentUser) {
    let storyID = $(evt.target).parent().attr("id").trim();
    removeFromHidden(storyID);
    $(evt.target).parent().hide();
    if (currentUser.hidden.length === 0) {
      $("#nav-hidden-stories-container").hide();
    }
    if (pageAppearsEmpty()) {
      displayEmptyMessage();
    }
  }
});

$allStoriesList.on("click", "i.fa-trash-alt", (evt) => {
  if (currentUser) {
    let storyID = $(evt.target).parent().attr("id").trim();
    storyList.deleteStory(storyID).then(() => {
      $(evt.target).parent().remove();
      if (pageAppearsEmpty()) {
        displayEmptyMessage();
      }
      if (currentUser.hidden.length === 0) {
        $("#nav-hidden-stories-container").hide();
      }
    });
  }
});
