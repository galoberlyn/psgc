import SwaggerUI from "swagger-ui-react"
import "swagger-ui-react/swagger-ui.css"

function App() {
  return (
    <SwaggerUI url={`${process.env.PUBLIC_URL}/docs.json`} />
  );
}

export default App;
