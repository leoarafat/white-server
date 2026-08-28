import config from '../../../../config';

export const agreementEmailBody = ({ user }: any) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agreement</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      margin: 50px;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 800px;
      margin: auto;
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 10px;
      background-color: #f9f9f9;
    }
    .title {
      text-align: center;
      font-size: 30px;
      font-weight: bold;
      margin-bottom: 40px;
      color: #2c3e50;
    }
    h1 {
      font-size: 22px;
      color: #2980b9;
      border-bottom: 2px solid #2980b9;
      padding-bottom: 5px;
    }
    p {
      margin: 10px 0;
    }
    .section {
      margin-bottom: 30px;
    }
    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 50px;
    }
    .signature-box {
      border: 1px solid #ccc;
      width: 45%;
      height: 200px;
      padding: 20px;
      border-radius: 10px;
      background-color: #fff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .signature-content {
      text-align: left;
    }
    .signature {
      height: 50px;
      width: auto;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="title">Agreement</div>

    <div class="section">
      <h1>CONTRACTOR</h1>
      <p>Name: ${user.name}</p>
      <p>Phone Number: ${user.phoneNumber}</p>
      <p>Channel Name: ${user.channelName}</p>
      <p>Channel URL: <a href="${user.channelUrl}">${user.channelUrl}</a></p>
    </div>

    <div class="section">
      <h1>DISTRIBUTOR</h1>
      <p>For and on behalf of ANS Music Limited.</p>
      <p>Name: Hasanuzzaman</p>
      <p>Designation: CEO, ANS Music Limited</p>
      <p>Date: ${new Date().toISOString().split('T')[0]}</p>
    </div>

    <div class="section">
      <h1>Purpose</h1>
      <p>1/ Contractor undertakes to deliver the Content (as defined below) to ANS Music Limited, on an exclusive basis, during the Exclusive Distribution Period and for the Territory.</p>
      <p>2/ Exclusive distribution rights of the Content for the Exclusive Distribution Period and on the Territory.</p>
    </div>

    <div class="section">
      <h1>Content</h1>
      <p>Worldwide. All the authorizations and rights set forth in this Agreement are granted for the Territory.</p>
    </div>

    <div class="section">
      <h1>Exclusive Distribution Period</h1>
      <p>From the Effective Date until 3 years following the date on which the first Recording is delivered to Distributor in compliance with Distributor's requirements ("Initial Distribution Period"). This period shall be automatically extended for successive 1-year periods ("Extended Distribution Period") unless a prior notice by registered mail is sent to the other party no later than 3 months before the starting date of each Extended Distribution Period. The Agreement cannot be terminated by Contractor as long as Contractor's balance account is negative. However, 10 years after the end of the Initial Distribution Period, Contractor may terminate this Agreement as stated above even if its balance account is negative.</p>
    </div>

    <div class="section">
      <h1>Final Terms</h1>
      <p><strong>DIGITAL DISTRIBUTION:</strong> 70.00% of the Net Receipts shall be paid to Contractor by ANS Music Limited, after deduction of (i) the amounts due for Mechanical Rights if applicable, (ii) duties and taxes (for the avoidance of doubt, including withholding taxes).</p>
    </div>

    <div class="section">
      <h1>Scope Of Exclusive Rights Granted By Contractor To Distributor</h1>
      <p>ANS Music Limited IS GRANTED THE FOLLOWING RIGHTS FOR THE EXCLUSIVE DISTRIBUTION PERIOD, WITHOUT PREJUDICE TO ANY OTHER RIGHTS AND AUTHORIZATIONS GRANTED UNDER THIS AGREEMENT: (i) the exclusive right to act as distributor and marketer of the Content (directly or indirectly); for this purpose, to digitise, reproduce, encode, store and transmit all or part of the Content, in full and in part, on any server and device and in all formats; (ii) the exclusive rights to make available the Content to the public and to any Third Party whose activity is related to Digital Distribution (including charts companies) in full and in part, in all formats, directly or through any Third Party as chosen by Distributor, with the rights for these Third Parties to distribute the Content; (iii) the non-exclusive right to use the Artist's Name and Likeness to promote the Content, Distributor, or the DSP; (iv) the exclusive rights to combine all or part of the Content with other third parties' content, in user generated content (UGC) online sharing services (such as YouTube, TikTok, Facebook) enabling end-users to upload and make available to the public content that incorporates any part of the Content. To this end: ANS Music Limited is, on an exclusive basis, granted all necessary rights and consents in relation to the management of the Content via such online sharing services (including channel management, control of contents, etc). Contractor may instruct ANS Music Limited in writing to (i) withdraw the possibility to use any part of the Content on any online sharing service or to (ii) monetise and/or block any such content created by end-users.</p>
    </div>

    <div class="section">
      <h1>Additional Explosions And Rights</h1>
      <p><strong>SYNCHRONIZATION / SAMPLING:</strong> Contractor appoints Distributor to manage synchronization/sampling opportunities. Such opportunities are subject to Contractor's prior approval (email being sufficient). However, where governed by a collective agreement or a user generated content license, Contractor's approval is not required. Accordingly, ANS Music Limited is granted the right to authorize third parties to (i) use the Content (in whole or in part) within an audio visual work (movie, advertisement, documentary, multimedia program, etc.) or live show ("Synchronization Right") and (ii) to authorise third parties to use samples taken from Recordings to produce new recordings, either audio or audiovisual (so-called 'sampling'). Those rights are granted by Contractor to Distributor, on a non-exclusive basis during the Exclusive Distribution Period.</p>
    </div>

    <div class="section">
      <h1>Deliver Of The Content</h1>
      <p><strong>DELIVERY TIMELINE / COMMERCIAL RELEASE:</strong> The delivery timeline of each item of the Content to Distributor by Contractor via Dashboard shall be agreed in good faith by the Parties. For sake of clarity, the delivery of: the first items of the New Release and/or if applicable of the Back-Catalogue shall, take place at the latest 1 month(s) following the Effective Date. In addition, Contractor acknowledges that if any item of the Content is delivered to Distributor less than 1 week before the planned commercial release date, this date may be delayed by the DSPs. The commercial release date of the Recordings shall be determined by mutual agreement between the Parties.</p>
      <p><strong>DISTRIBUTIOR AND DSP'S GUIDELINES:</strong> Delivery of any item of the Content following such guidelines shall be deemed compliant, unless ANS Music Limited OR DISTRIBUTIOR informs Contractor otherwise within 15 days following the delivery. ANS Music Limited may create, adjust, replace or remove Metadata to comply with requirements, at Contractor's cost if any. Contractor acknowledges that DSPs are free, at any time, to refuse, suspend or, definitively cease to distribute the Content or impose specific conditions in relation to the Content.</p>
    </div>

    <div class="section">
      <h1>Mechanical's Rights</h1>
      <p>Where DSPs require ANS Music Limited or Contractor to obtain Mechanical Rights licences for distributing the Content in a given territory, Distributor shall use its commercially reasonable endeavors to manage the Mechanical Rights licences (i.e. obtain and pay) on behalf of the Contractor. If for any reason Mechanical Rights licences are unavailable or have not been cleared in a territory (and Distributor has, to its sole satisfaction, sufficient documentary evidence of same), Distributor, at its sole discretion, may suspend the Digital Distribution of the Content via the concerned DSPs with regards to this territory.</p>
    </div>

    <div class="section">
      <h1>Video Monetization</h1>
      <p><strong>For sake of clarity:</strong> for the duration of this Agreement and under the conditions stated therein: (i) ANS Music Limited is, on an exclusive basis, appointed to monetise the Music Videos, in full and in part, in the videos made available on YouTube and/or any other online sharing services as chosen by Distributor, directly or through any Third Party and to make such videos available on its YouTube channel, Facebook, TikTok and/or any other online sharing services as chosen by Distributor, and (ii) the Music Videos' Content shall be deemed part of the Content, and therefore subject to the terms of this Agreement.</p>
    </div>

    <div class="signature-section">
      <div class="signature-box">
        <div class="signature-content">
        <strong>Artist Signature:</strong>
          <p>For and on behalf of ${user?.name}</p>
          <p>Designation: Owner</p>
        <p>Date: ${new Date().toISOString().split('T')[0]}</p>
          <img class="signature" src="${config.base_url}/${user.signature}" alt="Artist's Signature">
        </div>
      </div>
      <div class="signature-box">
        <div class="signature-content">         
          <strong>Company Signature:</strong>
          <p>Hasanuzzaman</p>
          <p>CEO, ANS Music Limited</p>
          <img class="signature" src="https://res.cloudinary.com/arafatleo/image/upload/v1720590692/IMG_1406_o6vljo.jpg" alt="Representative's Signature">
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

export default agreementEmailBody;
