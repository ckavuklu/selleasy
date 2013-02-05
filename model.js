// Loaded on both the client and the server

///////////////////////////////////////////////////////////////////////////////
// Items

/*
  Each item is represented by a document in the Parties collection:
    owner: user id
    title, description,price,pictures: String
    inviteds: Array of user id's that are invited (only if !public) 
    shares: Array of objects like {share:"facebook"}
    messages: Array of objects like {user: userId, message: "bla bla"} 
*/
Items = new Meteor.Collection("items");

Items.allow({
  insert: function (userId, item) {
    return false; // no cowboy inserts -- use createItem method
  },
  update: function (userId, items, fields, modifier) {
    return _.all(items, function (item) {
      if (userId !== item.owner)
        return false; // not the owner

      var allowed = ["title", "description", "price", "shares", "pictures", "messages"];
      if (_.difference(fields, allowed).length)
        return false; // tried to write to forbidden field

      // A good improvement would be to validate the type of the new
      // value of the field (and if a string, the length.) In the
      // future Meteor will have a schema system to makes that easier.
      return true;
    });
  },
  remove: function (userId, items) {
    return ! _.any(items, function (item) {
      // deny if not the owner, or if other people are going
      return item.owner !== userId;
    });
  }
});


/*
var advertised = function (item) {
  return (_.groupBy(item.rsvps, 'rsvp').yes || []).length;
};
*/


Meteor.methods({
  // options should include: title, description, price, shares, pictures
  createItem: function (options) {
    options = options || {};
    if (! (typeof options.title === "string" && options.title.length &&
           typeof options.description === "string" &&
           options.description.length
	   && typeof options.price === "string" &&
           options.price.length
	   && typeof options.pictures === "string" &&
           options.pictures.length
	   ))
      throw new Meteor.Error(400, "Required parameter missing");
    if (options.title.length > 100)
      throw new Meteor.Error(413, "Title too long");
    if (options.description.length > 1000)
      throw new Meteor.Error(413, "Description too long");
    if (! this.userId)
      throw new Meteor.Error(403, "You must be logged in");


    return Items.insert({
      owner: this.userId,
      price: options.price,
      title: options.title,
      description: options.description,
      shares: options.shares,
      messages: [],
      inviteds: [],
      pictures: options.pictures
    });
  },

  invite: function (itemId, userId) {
    var item = Items.findOne(itemId);
    if (! item || item.owner !== this.userId)
      throw new Meteor.Error(404, "No such item");
    if (_.contains(item.shares, "public"))
      throw new Meteor.Error(400,
                             "That item is public. No need to invite people.");
    if (userId !== item.owner && ! _.contains(item.inviteds, userId)) {
      Items.update(itemId, { $addToSet: { inviteds: userId } });

      var from = contactEmail(Meteor.users.findOne(this.userId));
      var to = contactEmail(Meteor.users.findOne(userId));
      if (Meteor.isServer && to) {
        // This code only runs on the server. If you didn't want clients
        // to be able to see it, you could move it to a separate file.
        Email.send({
          from: "noreply@example.com",
          to: to,
          replyTo: from || undefined,
          subject: "ITEM: " + item.title,
          text:
"Hey, I just made you elibigle to '" + item.title + "' " +
"\n\nCome check it out: " + Meteor.absoluteUrl() + "\n"
        });
      }
    }
  },

  message: function (itemId, message) {
    if (! this.userId)
      throw new Meteor.Error(403, "You must be logged in to send a message");
  
    var item = Items.findOne(itemId);
    if (! item)
      throw new Meteor.Error(404, "No such item");
    if (! _.contains(item.shares, "public") && item.owner !== this.userId &&
        !_.contains(item.inviteds, this.userId))
      throw new Meteor.Error(403, "No such item");

     Items.update(itemId,
                     {$push: {messages: {user: this.userId, message: message}}});
  }
});

///////////////////////////////////////////////////////////////////////////////
// Users

var displayName = function (user) {
  if (user.profile && user.profile.name)
    return user.profile.name;
  return user.emails[0].address;
};

var contactEmail = function (user) {
  if (user.emails && user.emails.length)
    return user.emails[0].address;
  if (user.services && user.services.facebook && user.services.facebook.email)
    return user.services.facebook.email;
  return null;
};
