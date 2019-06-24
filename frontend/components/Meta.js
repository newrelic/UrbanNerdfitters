import React from 'react';
import Head from 'next/head';

class Meta extends React.Component {
  state = { newrelic: '' };

  componentDidMount() {}

  render() {
    const newrelic = this.state.newrelic;
    return (
      <Head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta charSet="utf8" />
        <script src="/static/newrelic-browser.js" />
        <link rel="shortcut icon" href="/static/favicon.png" />
        <link rel="stylesheet" type="text/css" href="/static/nprogress.css" />
        <title>Urban Nerdfitters | Buy and Sell all things Nerd</title>
      </Head>
    );
  }
}

export default Meta;
