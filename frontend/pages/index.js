import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css'

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState('');

  const handleChangeLink = (event) => {
    setLink(event.target.value);
  };

  const handleDownloadClick = () => {
    setLoading(true);
    fetch(`http://localhost:5000/api/download?linkPlaylist=${link}`)
      .then(response => response.blob())
      .then((zipFile) => {
        setLoading(false);
        var blob = zipFile;
        var link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'download'
        document.body.appendChild(link)
        link.click();
      })
      .catch((error) => {
        console.log("Error: ", error)
      });
  }

  useEffect(() => {
    console.log(link);
  }, [link])

  return (
    <div className={styles.container}>
      <Head>
        <title>Youtube Playlist MP3 Download</title>
        <meta name="description" content="Youtube Playlist MP3 Download - Fazer o Download de uma playlist MP3" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Youtube Playlist MP3 Download
        </h1>

        <span className={styles.input}>
          <input
            type="text"
            placeholder="https://www.youtube.com/playlist?list=SAISOsjASOASHJXSsaSJIA"
            onChange={handleChangeLink}
            value={link}
            disabled={loading}
          >
          </input>
          <span></span>
        </span>

        <div className={styles.grid}>
          {!loading ?
            <button
              className={styles.button}
              role="button"
              disabled={!link || loading}
              onClick={handleDownloadClick}>
              Download
            </button>
            :
            <div>
              <div className={styles.loadingspinner} />
            </div>
          }
        </div>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>

        <a
          href="https://github.com/AugustoSavi"
          target="_blank"
          rel="noopener noreferrer"
        >
          Developed by{' '}
          <span className={styles.logo}>
            <Image src="/github.svg" alt="Github Logo" width={30} height={20} />
          </span>
        </a>
      </footer>
    </div>
  )
}
