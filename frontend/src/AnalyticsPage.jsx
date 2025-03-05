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
ChartJS.defaults.font.size = 16; // Increases text size across all charts

const AnalyticsPage = ({ token }) => {
  const analyticsData = useQuery(api.messages.getAnalytics, { token });
  console.log(analyticsData);

  if (!analyticsData) {
    return (
      <Container className="text-center my-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  // Totals Section
  const totals = {
    totalMessages: analyticsData.num_messages.total,
    totalDays: analyticsData.num_days,
    totalWords: analyticsData.num_words_total,
    messagesPerDay: analyticsData.messages_per_day,
  };

  // Pie Chart Data
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

  // For a scrollable horizontal bar chart: calculate a proper height.
  // For example: at least 600px or 25px per emoji label if there are many.
  const emojiChartHeight = Math.max(600, emojiLabels.length * 25);

  // Word Frequency Bar Chart – similar transformation (we'll update this later).
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

  // Texts per Time of Day (PST):
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

  return (
    <Container className="lovey-dashboard my-4">
      <h2 className="lovey-header mb-4">💖 Our Message Memories 💖</h2>

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
    {/* Outer container fixes the visible height and allows scrolling */}
    <div style={{ height: "600px", overflowY: "auto", border: "1px solid #ddd" }}>
      {/* Inner container is sized to the desired chart height */}
      <div style={{ height: `${emojiLabels.length * 25}px` }}>
        <Bar
          data={emojiData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: "y",
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { autoSkip: false } },
              y: { ticks: { autoSkip: false } },
            },
          }}
        />
      </div>
    </div>
  </Card.Body>
</Card>
        </Col>
        {/* Word Frequency Bar Chart (to update later) */}
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
