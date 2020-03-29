import { render } from "https://unpkg.com/preact@latest?module";
import {
  useState,
  useEffect
} from "https://unpkg.com/preact@latest/hooks/dist/hooks.module.js?module";
import { html } from "./html.js";
import { Spinner } from "./spinner.js";

const App = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState();

  const [current, setCurrent] = useState();

  useEffect(() => {
    let mounted = true;

    fetch("/api/status")
      .then(res => res.json())
      .then(res => {
        if (!mounted) return;
        setData(res);
        const defaultValue = window.location.hash.replace("#", "") || "World";
        setCurrent(res.find(item => item.country === defaultValue));
      })
      .finally(() => setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const changeCountry = value => {
    setCurrent(data.find(item => item.country === value));
    window.location.hash = value;
  };

  if (loading)
    return html`
      <${Spinner} />
    `;

  const { totalCases, activeCases } = current;

  const percentage = Math.round(
    ((totalCases - activeCases) / totalCases) * 100
  );

  let color = "danger";

  if (percentage >= 25 && percentage < 75) {
    color = "warning";
  } else if (percentage >= 75) {
    color = "success";
  }

  return html`
    <div class="content ${color}">
      <div class="content-wrapper">
        <div class="first-part">Covid-19 is</div>
        <div class="percentage-wrapper">
          <div class="percentage heartBeat animated">${percentage}%</div>
        </div>
        <div class="selector">
          <span>gone at</span>
          <select
            value=${current.country}
            onChange=${e => changeCountry(e.target.value)}
          >
            ${data.map(
              item =>
                html`
                  <option value=${item.country}>${item.country}</option>
                `
            )}
          </select>
        </div>

        <div class="more-info">
          <div class="more-info-item">
            <div class="label">Active cases</div>
            <div class="value">
              ${new Intl.NumberFormat().format(current.activeCases)}
            </div>
          </div>
          <div class="more-info-item">
            <div class="label">Total cases</div>
            <div class="value">
              ${new Intl.NumberFormat().format(current.totalCases)}
            </div>
          </div>
        </div>
      </div>
      <footer>
        Made with ${" "}
        <a href="https://glitch.com/edit/#!/covid19progress">Glitch</a>
      </footer>
    </div>
  `;
};
render(
  html`
    <${App} />
  `,
  document.getElementById("root")
);
