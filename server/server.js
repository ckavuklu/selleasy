// All Items -- server

Meteor.publish("directory", function () {
  return Meteor.users.find({}, {fields: {emails: 1, profile: 1}});
});

Meteor.publish("items", function () {

return Items.find(
    {$or: [{shares: "public"}, {inviteds: this.userId}, {owner: this.userId}]}
    );
});
