"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {
  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Parses hostname out of URL and returns it. */
  // UNIMPLEMENTED: complete this function!

  getHostName() {
    let hostname = this.url.match(/[\w|\.]+((?=\/)|(?=$))/);
    if (!hostname) {
      return "Hostname not found";
    }
    return hostname[0];
  }
}

/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
    this.currentDisplay = "nav-all";
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?
    //  -The getStories method doesn't require anything that would be unique to
    //    a StoryList instance, so it makes more sense to keep it a static method.

    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    // turn plain old story objects from API into instances of Story class
    const stories = response.data.stories.map((story) => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory(user, newStory) {
    const response = await axios.post(`${BASE_URL}/stories/`, {
      token: user.loginToken,
      story: { ...newStory },
    });
    let addedStory = new Story(response.data.story);
    this.stories.splice(0, 0, addedStory);
    user.ownStories.splice(0, 0, addedStory);
    return addedStory;
  }

  async deleteStory(storyID) {
    let url = `${BASE_URL}/stories/${storyID}`;
    let fetchInfo = {
      method: "DELETE",
      body: JSON.stringify({ token: currentUser.loginToken }),
    };
    let response = await fetch(url, fetchInfo);
    if (response.ok) {
      currentUser.removeStoryFromArrays(storyID);
      this.removeStoryFromArray(storyID);
    } else {
      return Promise.reject({
        status: response.status,
        statusText: response.statusText,
      });
    }
  }

  // Given a storyID, return the story with that ID from the stories array

  getStory(storyID) {
    for (let story of this.stories) {
      if (story.storyId === storyID) {
        return story;
      }
    }
    return null;
  }

  /*  A very similar function is used in the User class; neither class
      extends or inherits from the other, so I'm unsure if it would be
      better to define this outside of the scope of the classes and just
      reference it in each of them.

      Given a storyID, remove the story with that ID from the stories array
  */
  removeStoryFromArray(storyID) {
    let userDeleteIndex = this.stories
      .map((story) => story.storyId)
      .indexOf(storyID);
    this.stories.splice(userDeleteIndex, 1);
  }
}

/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor(
    { username, name, createdAt, favorites = [], ownStories = [] },
    token,
    hidden = []
  ) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map((s) => new Story(s));
    this.ownStories = ownStories.map((s) => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;

    //stories that the user has hidden from view
    this.hidden = hidden;
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    const response = await axios({
      url: `${BASE_URL}/signup`,
      method: "POST",
      data: { user: { username, password, name } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories,
      },
      response.data.token
    );
  }

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios({
      url: `${BASE_URL}/login`,
      method: "POST",
      data: { user: { username, password } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories,
      },
      response.data.token
    );
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      let { user } = response.data;

      let hidden = [];
      if (localStorage.getItem("hidden")) {
        hidden = JSON.parse(localStorage.getItem("hidden")).map(
          (story) => new Story(story)
        );
      }

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories,
        },
        token,
        hidden
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }

  isFavoriteStory(storyID) {
    return this.favorites.some((story) => story.storyId === storyID);
  }

  isHiddenStory(storyID) {
    return this.hidden.some((story) => story.storyId === storyID);
  }

  static async toggleStoryAsFavorite(selectedStoryID) {
    let url = `${BASE_URL}/users/${currentUser.username}/favorites/${selectedStoryID}`;
    let favoriteStatus = currentUser.isFavoriteStory(selectedStoryID);
    let method = favoriteStatus ? "delete" : "post";
    let fetchInfo = {
      method,
      body: JSON.stringify({ token: currentUser.loginToken }),
    };
    let response = await fetch(url, fetchInfo);
    if (response.ok) {
      currentUser.favorites = (await response.json()).user.favorites.map(
        (story) => new Story(story)
      );
      return currentUser.favorites;
    } else {
      return Promise.reject({
        status: response.status,
        statusText: response.statusText,
      });
    }
  }

  getIndexOfStory(arrayToSearch, storyID) {
    return this[arrayToSearch].map((story) => story.storyId).indexOf(storyID);
  }

  // Remove the story with a specific ID from all User arrays,
  // which are currently ownStories, favorites, and hidden
  removeStoryFromArrays(storyID) {
    for (let key of Object.keys(this)) {
      if (this[key] instanceof Array) {
        let userDeleteIndex = this.getIndexOfStory(key, storyID);
        if (userDeleteIndex >= 0) {
          this[key].splice(userDeleteIndex, 1);
          if (key === "hidden") {
            localStorage.setItem("hidden", JSON.stringify(this.hidden));
          }
        }
      }
    }
  }
}
