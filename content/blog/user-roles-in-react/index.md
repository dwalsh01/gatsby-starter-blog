---
title: Managing User Roles in React
date: "2019-03-13T23:46:37.121Z"
description: "How I handled user permissions in my application using CASL, Redux, and React Router"
---

So the best place to start when deciding authentiction systems is **use case**. For myself it was being implemented in a team software project as part of my degree.

We had to implement a grants proposal system which required various user interfaces for the **different types** of users.

The user roles we had in our system were:

- Researcher

- Reviewer

- Admin

## Libraries

### CASL

From some research online I found [CASL](https://github.com/stalniy/casl) (which has a nice [ReactJS package](https://github.com/stalniy/casl/tree/master/packages/casl-react)). CASL (pronounced _castle_) is described by the author as:

> An isomorphic authorization JavaScript library which restricts what resources a given user is allowed to access.

From reading up on this package it seemed perfect for my use case.

### Redux

Needs no introduction really, everyone who uses React knows about Redux. This was what I was most comfortable with for the storage of user information and the various responses to API calls within the application.

## Implementation

I am going to continue on the premise that you have a [functional redux store](https://medium.com/backticks-tildes/setting-up-a-redux-project-with-create-react-app-e363ab2329b8).

### Install Packages

To begin, you must first install the CASL packages neccessary. To do so run:

```bash
npm i @casl/react @casl/ability
```

### Scoping Can

For this section I will be operating with **2 files**, `ability.js` and `Can.js`. Both these files I have placed in a `config` folder. For help with file structure, please see [this helpful post](http://react-file-structure.surge.sh) by Dan Abramov.

Why should we scope `Can`? Well, if you don't scope it you must pass the `ability` we are checking against with every `Can` call (e.g. `<Can I="create" a="Post" ability={ability}>`, where `ability` is the abilities we defined in the `ability.js` file, or wherever you placed the abilities).

Scoping was implemented for cases where you define serveral abilities abilities in your app or you want to restrict a particular `Can` component to check abilities using another instance.

I took the implementation for our `Can.js` file from [the docs](https://github.com/stalniy/casl/tree/master/packages/casl-react):

```jsx
// Can.js
import { createCanBoundTo } from "@casl/react"
import ability from "./ability"

export default createCanBoundTo(ability)
```

We import our `ability` (defined in the next section) and scope this particular `Can` component to handle the those abilities.

### Defining Abilities For User Roles

```jsx{3}
// Can.js
import { createCanBoundTo } from "@casl/react"
import ability from "./ability"

export default createCanBoundTo(ability)
```

As you saw above, we import `ability`, which is where all user permissions are defined. So lets go to that file now. I am going to break it down into sections and then at the end show you the entire file.

```jsx
//ability.js
import { Ability, AbilityBuilder } from "@casl/ability"
import store from "../store/index"

// Defines how to detect object's type
function subjectName(item) {
  if (!item || typeof item === "string") {
    return item
  }
  return item.__type
}

const ability = new Ability([], { subjectName })
```

Okay, so what's going on here? The `subjectName` function takes in the object and will return the property `__type` of that object if it exits. Otherwise if the item passed is a string it will simply return that string, etc (I.E. if you pass `subjectName('Admin')` it will return `Admin`).

```jsx{13}
//ability.js
import { Ability, AbilityBuilder } from "@casl/ability"
import store from "../store/index"

// Defines how to detect object's type
function subjectName(item) {
  if (!item || typeof item === "string") {
    return item
  }
  return item.__type
}

const ability = new Ability([], { subjectName })
```

Now, what is this? Well, this is [one of two ways](https://www.npmjs.com/package/@casl/react#2-defining-abilities) to define an `Ability` instance. What we are doing here is defining an empty `Ability` instance, which will use the provided `subjectName` to help decide what rules to attach to a particular user.

Next, we will bring in the redux store to get the current logged in user, if there is any:

```jsx
//ability.js
...
const ability = new Ability([], { subjectName });

let currentAuth;
store.subscribe(() => {
  const prevAuth = currentAuth;
  currentAuth = store.getState().currentUserReducer;
  if (prevAuth !== currentAuth) {
    ability.update(defineRulesFor(currentAuth));
  }
});
```

Here we are subscribing to changes in the `store` and will call the `ability.update(defineRulesFor(currentAuth))` function with the current user in the store when the store **updates** the `currentUserReducer` object. For reference, here's my `currentUserReducer` object:

```jsx
//CurrentUserReducer
const initialState = {
  isLoggedIn: null,
  user: null,
  role: "",
  errorMsg: "",
}
```

But wait, what's the `defineRulesFor` function? Well, we implement this ourselves. Here we will return the rules for the current user based on their role. Here is our function:

```jsx
//ability.js
// this is just below store.subscribe()

function defineRulesFor(auth) {
  const { can, rules } = AbilityBuilder.extract()
  if (auth.role === "researcher") {
    can("view", "Proposal")
    can("view", "Draft")
    can("apply", "Proposal")
    can("view", "Profile")
    can("view", "Teams")
  }
  if (auth.role === "admin") {
    can("add", "Proposal")
    can("view", "Proposal")
    can("accept", "Application")
    can("reject", "Application")
    can("view", "PendingReviews")
  }
  if (auth.role === "reviewer") {
    can("review", "Proposal")
  }
  return rules
}
```

We are using CASL's `AbilityBuilder` to define the abilities for the user. We are calling the `extract()` method simply to make things more legible (_avoid nesting_). Otherwise it would look something like this:

```jsx
function defineRulesFor(auth) {
  return AbilityBuilder.define((can, cannot) => {
    if (user.role === "researcher") {
      can("view", "Proposal")
      can("view", "Draft")
      can("apply", "Proposal")
      can("view", "Profile")
      can("view", "Teams")
    }
  })
  //etc.
}
```

So this is just for my personal preference, both are perfectly fine I just find the first option easier to read.

Now, let's take the `researcher` role for an example to explain what's going on. We are saying that if the user is an researcher we want them to be able to:

- View a Proposal
- View a Draft
- Apply for a Proposal
- View a Profile
- View Teams

The `can` function will add these abilities to the `rules` for this user, once we have the rules defined for the user we then return them at the end of the function.

Now, we have covered how I specified the role based rules for each role. Let's get to implementing them in the UI!

### Checking rules in the UI

I will give two examples here where I have done this, one is which menu items appear in the sidebar for users to click, which takes them to a particular route, and the other is in rendering the routes only if you have the correct role.

#### Sidebar

We now use the `Can` component we previously defined (see the `Can.js` file above) to conditionally render components. Here is the `SidebarRoutes` component which renders `ListItemLink`'s where you pass the route and text displayed on the menu item:

```jsx
//SidebarRoutes.jsx
//Other imports here
import Can from '../../config/Can';

...

const SidebarRoutes = ({ classes }) => (
  <List className={classes.root}>
    <ListItemLink text="Home" />
    <Can I="view" a="Profile">
      {() => <ListItemLink route="profile" text="Profile" />}
    </Can>
    <NestedProposals />
  </List>
);
```

We import the `Can` component and check if **I can view a Profile**. If this is **true** then it will render the `ListItemLink`, otherwise it simply won't render it.

I do the same thing for the various rules in the `NestedProposals` component, which a snippet of can be seen below:

```jsx
//NestedProposals.jsx
...
<Can I="add" a="Proposal">
    {() => (
        <ListItemLink
        route="admin/proposals/add"
        text="Add Proposals"
        className={classes.nested}
        />
    )}
</Can>
<Can I="review" a="Proposal">
    {() => (
        <ListItemLink
        route="proposals/respond"
        text="Respond To Applications"
        className={classes.nested}
        />
    )}
</Can>
...
```

Essentially the same thing. I check if user roles permit them to do certain things, and if they are allowed I will render the link.

#### Routes

So again I will give a snippet of my `routes.jsx` file. Here it is:

```jsx
//routes.jsx
...
const Routes = () => (
  <Switch>
    <Route exact path="/" component={GridCards} />

    <Route
      path="/profile"
      render={props => (
        <Can I="view" a="Profile">
          {() => <Profile {...props} />}
        </Can>
      )}
    />
</Switch>
...

```

So we make use of React Router's `render` prop to let us check the rules of the current user and do the appropriate rendering. As you can see it's pretty much the same across the board for implementation once you have the rules properly defined.

## End

Thank you for reading! I would appreciate any input (positive/negative) on my writing to improve it going forward. Any thoughts/queries please feel free to shoot me a DM on Twitter.
