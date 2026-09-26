# Subscription Trackers (Channel & Playlist)

Instead of using a backend table to manage subscriptions natively, the app renders "Tracker Cards" directly into the UI alongside standard media.

## 1. Channel Card (`ChannelCard.jsx`)

The Channel Card is a visual representation of a YouTube Handle (`@username`) or Channel ID intentionally pulled into a playlist via the "Add Content" Modal.
- **Visual Structure:** Features a perfectly circular image representation, matching the aesthetic style of `OrbCard.jsx`. It acts as a cohesive avatar node inside the user's video folder grid.
- **Role:** Identified natively in `VideosPage.jsx` when handling lists of database objects having the `youtube.com/channel/` substring or `@` prefix. 
- **Syncing:** Read by the Subscription Manager to dynamically pull the latest 1, 5, 10, or 500 videos from that respective user.

## 2. Playlist Tracker (`PlaylistLinkCard.jsx`)

When a user pastes a full `?list=` URL into the Add Content Modal, the app pulls the individual videos but ALSO sequentially injects a `PlaylistLinkCard` as the very first object in the import array.
- **Visual Structure:** Uses a dark `#e0e7ff` (indigo-styled) theme with a subtle watermark `ListVideo` icon overlaid on a shadowed 16:9 thumbnail view to firmly differentiate it from a single video upload while maintaining overall row alignments.
- **Hover Gradient:** Reveals a "Playlist Tracker" subtitle identifying its role.
- **Role:** Keeps the source intent and URL string intact permanently as a card object so the user can continually ping that respective playlist list for newly uploaded segments using the Subscription Manager's "Refresh Latest" button.

*Both cards inherently support removal mechanics acting via the standard `removeVideoFromPlaylist` API because they are essentially treated by the system as specialized proxy video objects!*
