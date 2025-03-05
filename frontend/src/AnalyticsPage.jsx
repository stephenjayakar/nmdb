import React from "react";
import { Container, Row, Col, Card, Spinner } from "react-bootstrap";
import { Pie, Bar, Line, Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { WordCloudController, WordElement } from "chartjs-chart-wordcloud"; // Word Cloud Plugin
import "./AnalyticsPage.css"; // Custom lovey styles

import { useQuery } from "convex/react";
import { api } from "./convex/_generated/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  WordCloudController,
  WordElement
);
ChartJS.defaults.font.size = 16; // This line increases text size across all charts

const AnalyticsPage = ({ token }) => {
  const analyticsData = useQuery(api.messages.getAnalytics, { token });
  console.log(analyticsData)

  if (!analyticsData) {
    return (
      <Container className="text-center my-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  // Totals Section: Using the keys from the analytic JSON
  const totals = {
    totalMessages: analyticsData.num_messages.total,
    totalDays: analyticsData.num_days,
    totalWords: analyticsData.num_words_total,
    messagesPerDay: analyticsData.messages_per_day,
  };

  // Pie Chart Data: Who sent more messages? Using messages from Nadia & Stephen.
  const pieData = {
    labels: ["Nadia", "Stephen"],
    datasets: [
      {
        data: [
          analyticsData.num_messages.nadia,
          analyticsData.num_messages.stephen,
        ],
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Emoji Frequency Bar Chart – transform the emoji_frequency list into labels and counts.
  const emojiLabels = analyticsData.emoji_frequency.map((item) => item[0]);
  const emojiCounts = analyticsData.emoji_frequency.map((item) => item[1]);
  const emojiData = {
    labels: emojiLabels,
    datasets: [
      {
        label: "Emoji Frequency",
        data: emojiCounts,
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  // Word Frequency Bar Chart – similar transformation.
  const wordLabels = analyticsData.word_frequency.map((item) => item[0]);
  const wordCounts = analyticsData.word_frequency.map((item) => item[1]);
  const wordData = {
    labels: wordLabels,
    datasets: [
      {
        label: "Word Frequency",
        data: wordCounts,
        backgroundColor: "rgba(153, 102, 255, 0.6)",
      },
    ],
  };

  // Message Frequency per Day per Person:
  // analyticsData.message_frequency_per_day_per_person is expected to be an object like:
  // { "2023-09-01": { "nadia": count, "stephen": count }, ... }
  const days = Object.keys(analyticsData.message_frequency_per_day_per_person).sort(
    (a, b) => new Date(a) - new Date(b)
  );
  const datasetNadia = days.map(
    (day) => analyticsData.message_frequency_per_day_per_person[day].nadia || 0
  );
  const datasetStephen = days.map(
    (day) => analyticsData.message_frequency_per_day_per_person[day].stephen || 0
  );

  const messageFrequencyData = {
    labels: days,
    datasets: [
      {
        label: "Nadia",
        data: datasetNadia,
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        fill: false,
      },
      {
        label: "Stephen",
        data: datasetStephen,
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        fill: false,
      },
    ],
  };

  // Texts per Time of Day (PST) Bar Chart:
  // analyticsData.message_count_by_hour is an object with keys like "00", "01", etc.
  const timeLabels = Object.keys(analyticsData.message_count_by_hour);
  const sortedTimeLabels = timeLabels.sort((a, b) => parseInt(a) - parseInt(b));
  const timeCounts = sortedTimeLabels.map(
    (time) => analyticsData.message_count_by_hour[time]
  );
  const textsPerTimeData = {
    labels: sortedTimeLabels,
    datasets: [
      {
        label: "Texts per Time (PST)",
        data: timeCounts,
        backgroundColor: "rgba(255, 206, 86, 0.6)",
      },
    ],
  };

  // const validWords = analyticsData.word_frequency.filter(
  //   ([word, count]) => word && count > 0
  // );
  // const wordCloudLabels = validWords.map(([word]) => word);
  // const wordCloudCounts = validWords.map(([, count]) => count);

  // const wordCloudData = {
  //   labels: wordCloudLabels,
  //   datasets: [
  //     {
  //       label: "Word Frequency",
  //       data: wordCloudCounts,
  //       backgroundColor: "rgba(255, 99, 132, 0.6)",
  //     },
  //   ],
  // };

  // const wordCloudOptions = {
  //   responsive: true,
  //   plugins: {
  //     legend: { display: false },
  //   },
  //   elements: {
  //     word: {
  //       fontSize: (ctx) => {
  //         // Ensure a minimum font size so that words are always visible
  //         const size = ctx.raw;
  //         return Math.max(size * 0.5 + 10, 14);
  //       },
  //       rotation: () => Math.random() * 60 - 30,
  //       padding: 2,
  //     },
  //   },
  // };
  console.log(emojiData)

  return (
    <Container className="lovey-dashboard my-4">
      <h2 className="lovey-header mb-4">💖 Our Message Memories 💖</h2>

      {/* Word Cloud Section
      <Card className="lovey-card mb-4">
        <Card.Header>💬 Our Most Used Words 💬</Card.Header>
        <Card.Body>
          <div style={{ width: "100%", height: "350px" }}>
            <Chart type="wordCloud" data={wordCloudData} options={wordCloudOptions} />
          </div>
        </Card.Body>
      </Card>*/}

      <Row>
        <Col md={6} className="mb-4">
          {/* Totals Section */}
          <Card className="lovey-card mb-4">
            <Card.Header>Totals</Card.Header>
            <Card.Body>
              <Row>
                <Col>
                  <strong>Total Messages:</strong> {totals.totalMessages}
                </Col>
                <Col>
                  <strong># of Days:</strong> {totals.totalDays}
                </Col>
              </Row>
              <Row className="mt-3">
                <Col>
                  <strong># of Words:</strong> {totals.totalWords}
                </Col>
                <Col>
                  <strong>Messages per Day:</strong> {totals.messagesPerDay}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} className="mb-4">
          {/* Pie Chart Section */}
          <Card className="lovey-card mb-4">
            <Card.Header>Who Sent More Messages?</Card.Header>
            <Card.Body>
              <Pie data={pieData} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6} className="mb-4">
          <Card className="lovey-card">
            <Card.Header>Emoji Frequency</Card.Header>
            <Card.Body>
              {/* Wrap the chart in a container that scrolls if there are many bars */}
              <div style={{ height: "600px", overflowY: "scroll" }}>
                <Bar
                  data={emojiData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    // Use horizontal bars instead of vertical ones
                    indexAxis: "y",
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      // Optionally disable auto-skipping for tick labels so that all labels show
                      x: { ticks: { autoSkip: false } },
                      y: { ticks: { autoSkip: false } },
                    },
                  }}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
        {/* Word Frequency Bar Chart */}
        <Col md={6} className="mb-4">
          <Card className="lovey-card">
            <Card.Header>Word Frequency</Card.Header>
            <Card.Body>
              <Bar
                data={wordData}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                }}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Message Frequency Line Chart */}
      <Card className="lovey-card mb-4">
        <Card.Header>Message Frequency per Day (Nadia & Stephen)</Card.Header>
        <Card.Body>
          <Line
            data={messageFrequencyData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: "top" },
                title: { display: true, text: "Messages per Day" },
              },
            }}
          />
        </Card.Body>
      </Card>

      {/* Texts per Time of Day (PST) */}
      <Card className="lovey-card mb-4">
        <Card.Header>Texts per Time of Day (PST)</Card.Header>
        <Card.Body>
          <Bar
            data={textsPerTimeData}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
            }}
          />
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AnalyticsPage;
