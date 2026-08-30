import session from "express-session";

/**
 * High-performance, permanent Firestore session store
 * Keeps users permanently logged in across server reboots, rebuilds, and restarts.
 */
export class FirestoreSessionStore extends session.Store {
  constructor(getFirestoreFn) {
    super();
    this.getFirestore = getFirestoreFn;
  }

  getCollection() {
    const fs = typeof this.getFirestore === "function" ? this.getFirestore() : this.getFirestore;
    return fs ? fs.collection("sessions") : null;
  }

  get(sid, callback) {
    const col = this.getCollection();
    if (!col) return callback(null, null);

    col.doc(sid).get()
      .then((doc) => {
        if (!doc.exists) return callback(null, null);
        const data = doc.data();
        if (data.expires && data.expires < Date.now()) {
          this.destroy(sid, () => {});
          return callback(null, null);
        }
        return callback(null, data.session);
      })
      .catch((err) => callback(err));
  }

  set(sid, sess, callback) {
    const col = this.getCollection();
    if (!col) return callback && callback(null);

    const expires = sess.cookie?.expires
      ? new Date(sess.cookie.expires).getTime()
      : Date.now() + 365 * 24 * 60 * 60 * 1000;

    // Convert session to plain JSON object (Firestore doesn't support class instances)
    const plainSession = JSON.parse(JSON.stringify(sess));

    col.doc(sid).set(
      {
        session: plainSession,
        expires,
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    )
      .then(() => callback && callback(null))
      .catch((err) => callback && callback(err));
  }

  destroy(sid, callback) {
    const col = this.getCollection();
    if (!col) return callback && callback(null);

    col.doc(sid).delete()
      .then(() => callback && callback(null))
      .catch((err) => callback && callback(err));
  }

  touch(sid, sess, callback) {
    const col = this.getCollection();
    if (!col) return callback && callback(null);

    const expires = sess.cookie?.expires
      ? new Date(sess.cookie.expires).getTime()
      : Date.now() + 365 * 24 * 60 * 60 * 1000;

    col.doc(sid).update({ expires })
      .then(() => callback && callback(null))
      .catch(() => callback && callback(null));
  }
}
