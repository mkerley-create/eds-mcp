import {createEdsMcpServer} from '@edmunds/eds-mcp';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {createMcpExpressApp} from '@modelcontextprotocol/sdk/server/express.js';

if (process.env.EDS_MCP_TRANSPORT === 'http') {
  const host = process.env.HOST ?? '127.0.0.1';
  const port = Number(process.env.PORT ?? 8787);
  const requiredToken = process.env.EDS_MCP_BEARER_TOKEN;
  const app = createMcpExpressApp({host});

  app.post('/mcp', async (request, response) => {
    if (requiredToken && request.headers.authorization !== `Bearer ${requiredToken}`) {
      response.status(401).json({error: 'Unauthorized'});
      return;
    }
    const server = await createEdsMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    response.on('close', () => {
      void transport.close();
      void server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(request, response, request.body);
  });

  app.listen(port, host, () => {
    console.error(`EDS MCP listening on http://${host}:${port}/mcp`);
  });
} else {
  const server = await createEdsMcpServer();
  await server.connect(new StdioServerTransport());
}
