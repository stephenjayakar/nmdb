import { useState, useEffect, useRef } from "react";

const Timeline = ({ minDate, maxDate, onDateSelect }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [months, setMonths] = useState([]);

  useEffect(() => {
    if (!minDate || !maxDate) return;

    const min = new Date(minDate);
    const max = new Date(maxDate);
    const monthsList = [];

    let currentDate = new Date(min);
    currentDate.setDate(1); // Start at beginning of month

    while (currentDate <= max) {
      // Calculate month height based on number of days
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      monthsList.push({
        date: new Date(currentDate),
        daysInMonth,
        label: currentDate.toLocaleString("default", {
          month: "short",
          year: "numeric",
        }),
      });

      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    setMonths(monthsList);
  }, [minDate, maxDate]);

  const handleClick = (e) => {
    // Calculate position relative to timeline height
    const timeline = e.currentTarget;
    const rect = timeline.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const percentage = clickY / rect.height;

    // Calculate date based on percentage between min and max
    const min = new Date(minDate);
    const max = new Date(maxDate);
    const totalMs = max - min;
    const selectedMs = min.getTime() + percentage * totalMs;
    const date = new Date(selectedMs);

    setSelectedDate(date);
    console.log(date);
    if (onDateSelect) onDateSelect(date);
  };

  return (
    <div
      className="timeline-container"
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        bottom: 0,
        width: "60px",
        backgroundColor: "#f8f9fa",
        boxShadow: "-2px 0 5px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
      }}
    >
      <div
        className="timeline"
        style={{
          flex: 1,
          position: "relative",
          cursor: "pointer",
        }}
        onClick={handleClick}
      >
        {months.map((month, index) => {
          // Calculate proportional height based on days in month
          const totalDays = months.reduce((sum, m) => sum + m.daysInMonth, 0);
          const heightPercentage = (month.daysInMonth / totalDays) * 100;

          return (
            <div
              key={month.label}
              className="timeline-month"
              style={{
                height: `${heightPercentage}%`,
                position: "relative",
                borderBottom: "1px solid #dee2e6",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                className="month-label"
                style={{
                  fontSize: "10px",
                  textAlign: "center",
                  padding: "2px 0",
                  fontWeight: "bold",
                }}
              >
                {month.label}
              </div>

              {/* Day markers */}
              <div style={{ flex: 1, position: "relative" }}>
                {Array.from({ length: month.daysInMonth }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: `${(i / month.daysInMonth) * 100}%`,
                      borderBottom:
                        (i + 1) % 5 === 0
                          ? "1px solid #ced4da"
                          : "1px dotted #e9ecef",
                      height: "1px",
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Selected date indicator */}
        {selectedDate && (
          <div
            className="selected-date-indicator"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: "2px",
              backgroundColor: "#007bff",
              top: `${
                ((selectedDate - new Date(minDate)) /
                  (new Date(maxDate) - new Date(minDate))) *
                100
              }%`,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Timeline;
