# dozzle (experimental fork)

An experimental build of [amir20/dozzle](https://github.com/amir20/dozzle), the
lightweight web-based Docker log viewer.

**This is not official Dozzle.** It is a personal fork carrying a large UI
overhaul, and most of what is in here may never reach upstream. It exists purely
so people can try the changes and send feedback. For anything you depend on, run
the official image: `amir20/dozzle`.

```bash
docker run -d --name dozzle \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -p 8080:8080 \
  lbypatrick/dozzle:latest
```

Configuration, auth, agents, and Swarm/Kubernetes modes work as they do upstream
([docs](https://dozzle.dev)). Tags: `latest` and `exp` are the newest build,
`exp-<sha>` pins a commit. Built for `linux/amd64` and `linux/arm64`.

Feedback: <https://github.com/LBYPatrick/dozzle/issues>. Please do not file fork
bugs on the upstream tracker.

---
