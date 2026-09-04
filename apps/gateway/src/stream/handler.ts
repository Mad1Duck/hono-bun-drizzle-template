import { Hono } from "hono";
import { API_VERSION } from "@repo/shared";
import { wsHandler } from "./connector/ws.connector";
import { sseConnector } from "./connector/sse.connector";

const stream = new Hono()
  .get(`/${API_VERSION}/ws/:topic`, wsHandler)
  .get(`/${API_VERSION}/events/:topic`, (c) => {
    const topic = c.req.param("topic");
    if (!topic) {
      return c.text("Missing topic", 400);
    }

    const body = sseConnector.subscribe(topic);
    return new Response(body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  });

export default stream;
