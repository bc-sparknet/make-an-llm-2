import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <>
      <h1>Page not found</h1>
      <p>
        That page doesn&rsquo;t exist. <Link to="/">Back to the chapter list</Link>.
      </p>
    </>
  );
}
