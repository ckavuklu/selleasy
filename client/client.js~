// All Tomorrow's Parties -- client

Meteor.subscribe("directory");
Meteor.subscribe("items");

 

// If no party selected, select one.
if (Meteor.isServer) {
Meteor.startup(function () {
  Meteor.autorun(function () {

  });
 
});
}

///////////////////////////////////////////////////////////////////////////////
// Item details sidebar

Template.details.item = function () {
  return Items.findOne(Session.get("selected"));
};

Template.details.anyItems = function () {
  return Items.find().count() > 0;
};

Template.details.creatorName = function () {
  var owner = Meteor.users.findOne(this.owner);
  if (owner._id === Meteor.userId())
    return "me";
  return displayName(owner);
};

Template.details.canRemove = function () {
  return this.owner === Meteor.userId(); 
};


Template.details.maybeChosen = function (what) {
  var myRsvp = _.find(this.rsvps, function (r) {
    return r.user === Meteor.userId();
  }) || {};

  return what == myRsvp.rsvp ? "chosen btn-inverse" : "";
};


Template.details.events({
  'click .rsvp_yes': function () {
    Meteor.call("rsvp", Session.get("selected"), "yes");
    return false;
  },
  'click .rsvp_maybe': function () {
    Meteor.call("rsvp", Session.get("selected"), "maybe");
    return false;
  },
  'click .rsvp_no': function () {
    Meteor.call("rsvp", Session.get("selected"), "no");
    return false;
  },
  'click .eligible': function () {
    openEligibilityDialog();
    return false;
  },
  'click .remove': function () {
    Items.remove(this._id);
    return false;
  }
});

///////////////////////////////////////////////////////////////////////////////
// Items eligible widget

Template.invited.userName = function () {
  var user = Meteor.users.findOne(this.user);
  return displayName(user);
};

Template.invited.invitations = function () {
  var item = Items.findOne(this._id);
  return Meteor.users.find({_id: {$in: item.inviteds}}); // they're invited
};

/*
Template.invited.public = function () {
  var item = Items.findOne(this._id);
  return _.contains(item.shares, "public"); 
);
*/

Template.invited.invitationName = function () {
  return displayName(this);
};

Template.invited.rsvpIs = function (what) {
  return this.rsvp === what;
};

Template.invited.nobody = function () {
  return (this.shares.length === 0) && (this.inviteds.length === 0);
};

Template.invited.canInvite = function () {
  return ! _.contains(item.shares, "public") && (this.owner === Meteor.userId() || _.contains(item.inviteds, Meteor.userId())) ;
};

///////////////////////////////////////////////////////////////////////////////
// Item grid display
//

Template.itemgrid.eligible = function () {
  return displayName(this);
};


Template.itemgrid.events({
    'click': function (event, template) {
      Session.set("selected", this._id);
    }
  });

Template.details.events({
  'click .createitem': function (event, template) {

    if (! Meteor.userId()) // must be logged in to create events
      return;

   openCreateDialog();
  }

});

///////////////////////////////////////////////////////////////////////////////
// Create Party dialog

var openCreateDialog = function () {
  Session.set("createError", null);
  Session.set("showCreateDialog", true);
};

Template.page.showCreateDialog = function () {
  return Session.get("showCreateDialog");
};

Template.createDialog.events({
  'click .save': function (event, template) {
    var title = template.find(".title").value;
    var description = template.find(".description").value;
    var prices = template.find(".price").value;
    var photo = template.find(".photopath").value;

    var shareValue = [];
    if (! template.find(".private").checked) {
      shareValue.push("public");
    }

    if (template.find(".facebook").checked) {
      shareValue.push("facebook");
    }
    if (template.find(".twitter").checked) {
      shareValue.push("twitter");
    }

    if (title.length && description.length) {
      Meteor.call('createItem', {
        title: title,
        description: description,
        price: prices,
	pictures: photo,
        shares:shareValue
      }, function (error, item) {
        if (! error) {
          Session.set("selected", item);
          if (! _.contains(item.shares, "public") && Meteor.users.find().count() > 1)
            openEligibilityDialog();
        } else {
          Session.set("createError",
                  "Had a problem creating item");
        }
      });
      Session.set("showCreateDialog", false);
    } else {
      Session.set("createError",
                  "It needs a title and a description, or why bother?");
    }
  },

  'click .cancel': function () {
    Session.set("showCreateDialog", false);
  }
});

Template.createDialog.error = function () {
  return Session.get("createError");
};

///////////////////////////////////////////////////////////////////////////////
// Invite dialog

var openEligibilityDialog = function () {
  Session.set("showEligibilityDialog", true);
};

Template.page.showEligibilityDialog = function () {
  return Session.get("showEligibilityDialog");
};

Template.eligibilityDialog.events({
  'click .invite': function (event, template) {
    Meteor.call('invite', Session.get("selected"), this._id);
  },
  'click .done': function (event, template) {
    Session.set("showEligibilityDialog", false);
    return false;
  }
});

Template.eligibilityDialog.noneligible = function () {
  var item = Items.findOne(Session.get("selected"));
  if (! item)
    return []; // party hasn't loaded yet
  return Meteor.users.find({$nor: [{_id: {$in: item.inviteds}},
                                   {_id: item.owner}]});
};

Template.itemgrid.eligibleItems = function () {
  return Items.find().fetch();
};

Template.eligibilityDialog.displayName = function () {
  return displayName(this);
};
