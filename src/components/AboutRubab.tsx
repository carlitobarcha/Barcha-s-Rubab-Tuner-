import { useRef } from 'react';

export default function AboutRubab() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        className="about-button"
        onClick={() => dialogRef.current?.showModal()}
      >
        About the Rubab
      </button>

      <dialog
        ref={dialogRef}
        className="about-dialog"
        aria-labelledby="about-title"
        onClick={(e) => {
          // A click on the dark area outside the card closes it.
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <div className="about-body">
          <h2 id="about-title" className="about-title">
            About the Rubab
          </h2>
          <p className="about-subtitle">THE LION OF INSTRUMENTS</p>

          <p className="about-text">
            The rubab is a short-necked, plucked lute and one of the national
            instruments of Afghanistan. It is also played in the Pashtun regions
            of Pakistan, in Kashmir and across Central Asia, and it is
            regarded as an ancestor of the Indian sarod.
          </p>
          <p className="about-text">
            Its body is carved from a single piece of mulberry wood in two
            connected chambers. The lower chamber is covered with animal skin,
            usually goat, and the upper one carries the fingerboard, which is
            often decorated with fine inlay.
          </p>
          <p className="about-text">
            Three main strings, tuned in fourths, carry the melody. Two or
            three drone strings keep the rhythm and a steady base. Beneath
            them run up to about fifteen sympathetic strings, called tarab
            strings, tuned to the notes of the raag. They ring on their own
            when a matching note is played, which gives the rubab its
            shimmering, echoing voice.
          </p>
          <p className="about-text">
            This app listens through your microphone and shows the note and
            frequency you play as it happens. Choose a Sa and a raag to see
            which notes belong to it, which helps when tuning the main and
            sympathetic strings.
          </p>

          <button
            type="button"
            className="about-close"
            onClick={() => dialogRef.current?.close()}
          >
            Close
          </button>
        </div>
      </dialog>
    </>
  );
}