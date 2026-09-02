import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useMetaDescription } from '../hooks/useMetaDescription'
import { useCanonicalUrl } from '../hooks/useCanonicalUrl'
import './About.css'

const interests = [
  'UI/UX design',
  'Design systems',
  'Frontend architecture',
  'Accessibility',
  'Prototyping',
  'Writing',
]

const now = [
  {
    title: 'Writing here',
    text: 'Publishing notes on whatever I ran into this week — interface decisions, CSS, React, and the occasional bad call I had to undo.',
  },
  {
    title: 'Building in the open',
    text: 'Keeping a running side-project folder where new ideas get tried out long before they are ever polished.',
  },
  {
    title: 'Reading more, scrolling less',
    text: "Trying to spend the attention I'd otherwise burn on feeds on something with a bit more shelf life.",
  },
]

export function About() {
  useDocumentTitle('About — Ian Tirop')
  useMetaDescription(
    "Ian Tirop is a developer and UI/UX designer writing about interface decisions, CSS, React, and the process of building and learning in public.",
  )
  useCanonicalUrl()
  return (
    <section className="container about-page">
      <div className="about-header">
        <div className="avatar" aria-hidden="true">
          IT
        </div>
        <p className="eyebrow">About</p>
        <h1>Hi, I&apos;m Ian Tirop.</h1>
        <p className="about-intro">
          I&apos;m a developer and UI/UX designer — I build the things I
          design and write about what breaks along the way, on both sides
          of that line. This site is equal parts portfolio, notebook, and
          public record of everything I&apos;m still figuring out.
        </p>
      </div>

      <div className="about-grid">
        <div className="about-block">
          <h2>What I care about</h2>
          <p>
            Software that feels considered rather than assembled — where the
            small details (an easing curve that matches what just happened
            on screen, a focus ring that&apos;s actually visible, a
            line-height that was chosen instead of inherited) get the same
            attention as the headline feature.
          </p>
          <div className="interest-tags">
            {interests.map((interest) => (
              <span key={interest} className="tag">
                {interest}
              </span>
            ))}
          </div>
        </div>

        <div className="about-block">
          <h2>Right now</h2>
          <ul className="now-list">
            {now.map((item) => (
              <li key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="about-cta">
        <p>Want to talk about any of this?</p>
        <Link to="/contact" className="btn btn-primary">
          Get in touch
        </Link>
      </div>
    </section>
  )
}
