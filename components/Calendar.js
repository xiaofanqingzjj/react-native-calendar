import React, { Component, PropTypes } from 'react';
import {
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Day from './Day';

import moment from 'moment';
import styles from './styles';

const DEVICE_WIDTH = Dimensions.get('window').width;
const VIEW_INDEX = 2;

export default class Calendar extends Component {

  state = {
    currentMonthMoment: moment(this.props.startDate),
    selectedMoment: moment(this.props.selectedDate)
  };

  static propTypes = {
    customStyle: PropTypes.object,
    dayHeadings: PropTypes.array,
    eventDates: PropTypes.array,
    monthNames: PropTypes.array,
    nextButtonText: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object
    ]),
    onDateSelect: PropTypes.func,
    onSwipeNext: PropTypes.func,
    onSwipePrev: PropTypes.func,
    onTouchNext: PropTypes.func,
    onTouchPrev: PropTypes.func,
    prevButtonText: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object
    ]),
    scrollEnabled: PropTypes.bool,
    selectedDate: PropTypes.any,
    showControls: PropTypes.bool,
    showEventIndicators: PropTypes.bool,
    startDate: PropTypes.any,
    titleFormat: PropTypes.string,
    today: PropTypes.any,
    weekStart: PropTypes.number,
    calendarFormat: PropTypes.string
  };

  static defaultProps = {
    customStyle: {},
    width: DEVICE_WIDTH,
    dayHeadings: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    eventDates: [],
    monthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    nextButtonText: 'Next',
    prevButtonText: 'Prev',
    scrollEnabled: false,
    showControls: false,
    showEventIndicators: false,
    startDate: moment().format('YYYY-MM-DD'),
    titleFormat: 'MMMM YYYY',
    today: moment(),
    weekStart: 1,
    calendarFormat: 'monthly' // weekly or monthly
  };

  componentDidMount() {
    // fixes initial scrolling bug on Android
    setTimeout(() => this.scrollToItem(VIEW_INDEX), 0);
  }

  componentDidUpdate() {
    this.scrollToItem(VIEW_INDEX);
  }

  componentWillReceiveProps(props) {
    if (props.selectedDate) {
      this.setState({selectedMoment: props.selectedDate});
    }
  }

  getMonthStack(currentMonth) {
    if (this.props.scrollEnabled) {
      const res = [];
      for (let i = -VIEW_INDEX; i <= VIEW_INDEX; i++) {
        res.push(moment(currentMonth).add(i, 'month'));
      }
      return res;
    }
    return [moment(currentMonth)];
  }

  prepareEventDates(eventDates, events) {
    const parsedDates = {};

    if (events) {
      events.forEach(event => {
        if (event.date) {
          parsedDates[event.date] = event;
        }
      });
    } else {
      eventDates.forEach(event => {
        parsedDates[event] = {};
      });
    }

    return parsedDates;
  }

  selectDate(date) {
    this.setState({ selectedMoment: date,
                    currentMonthMoment: date});
  }

  onPrev = () => {
    const newMoment = this.props.calendarFormat == 'monthly' ?
            moment(this.state.currentMonthMoment).subtract(1, 'month'):
            moment(this.state.currentMonthMoment).subtract(1, 'week');
    this.setState({ currentMonthMoment: newMoment });
    this.props.onTouchPrev && this.props.onTouchPrev(newMoment);
  }

  onNext = () => {
    const newMoment = this.props.calendarFormat == 'monthly' ?
            moment(this.state.currentMonthMoment).add(1, 'month'):
            moment(this.state.currentMonthMoment).add(1, 'week');
    this.setState({ currentMonthMoment: newMoment });
    this.props.onTouchNext && this.props.onTouchNext(newMoment);
  }

  scrollToItem(itemIndex) {
    const scrollToX = itemIndex * this.props.width;
    if (this.props.scrollEnabled) {
      this._calendar.scrollTo({ y: 0, x: scrollToX, animated: false });
    }
  }

  scrollEnded(event) {
    const position = event.nativeEvent.contentOffset.x;
    const currentPage = position / this.props.width;
    const newMoment = moment(this.state.currentMonthMoment).add(currentPage - VIEW_INDEX, 'month');
    this.setState({ currentMonthMoment: newMoment });

    if (currentPage < VIEW_INDEX) {
      this.props.onSwipePrev && this.props.onSwipePrev(newMoment);
    } else if (currentPage > VIEW_INDEX) {
      this.props.onSwipeNext && this.props.onSwipeNext(newMoment);
    }
  }

  getStartMoment(calFormat, currMoment) {
    const weekStart = this.props.weekStart;

    let r;
    if (calFormat == "monthly") {
      r = moment(currMoment).startOf('month');
    } else {
      // weekly
      let sundayMoment = moment(currMoment).startOf('week');
      if (weekStart > 0) {
        r = moment(currMoment).isoWeekday(weekStart);
        if (r.diff(currMoment) > 0) {
          r = moment(currMoment).subtract(7, 'day').isoWeekday(weekStart);
        }
      } else {
        r = sundayMoment;
      }
    }
    return r;
  }

  renderCalendarView(calFormat, argMoment, eventsMap) {
    let renderIndex = 0,
        weekRows = [],
        days = [];
        // startOfArgMoment = this.getStartMoment(calFormat, argMoment);

    const
    startOfArgMoment = this.getStartMoment(calFormat, argMoment),
    selectedMoment = moment(this.state.selectedMoment),
    weekStart = this.props.weekStart,
    todayMoment = moment(this.props.today),
    todayIndex = todayMoment.date() - 1,
    argDaysCount = calFormat == "monthly" ? argMoment.daysInMonth(): 7,
    offset = calFormat == "monthly" ?
      (startOfArgMoment.isoWeekday() - weekStart + 7) % 7: 0,
    selectedIndex = moment(selectedMoment).date() - 1;

    do {
      const dayIndex = renderIndex - offset;
      const isoWeekday = (renderIndex + weekStart) % 7;
      const thisMoment = moment(startOfArgMoment).add(dayIndex, 'day');

      if (dayIndex >= 0 && dayIndex < argDaysCount) {
        days.push((
          <Day
             startOfMonth={startOfArgMoment}
             isWeekend={isoWeekday === 0 || isoWeekday === 6}
             key={`${renderIndex}`}
             onPress={() => {
               this.selectDate(thisMoment);
               this.props.onDateSelect && this.props.onDateSelect(thisMoment ? thisMoment.format(): null );
            }}
            caption={`${thisMoment.format('D')}`}
            isToday={todayMoment.format('YYYY-MM-DD') == thisMoment.format('YYYY-MM-DD')}
            isSelected={selectedMoment.isSame(thisMoment)}
            event={eventsMap[thisMoment.format('YYYY-MM-DD')] ||
                   eventsMap[thisMoment.format('YYYYMMDD')]}
            showEventIndicators={this.props.showEventIndicators}
            customStyle={this.props.customStyle}
            />
        ));
      } else {
        days.push(<Day key={`${renderIndex}`} filler customStyle={this.props.customStyle} />);
      }
      if (renderIndex % 7 === 6) {
        weekRows.push(
          <View
             key={weekRows.length}
             style={[styles.weekRow, this.props.customStyle.weekRow]}
             >
            {days}
          </View>);
        days = [];
        if (dayIndex + 1 >= argDaysCount) {
          break;
        }
      }
      renderIndex += 1;
    } while (true)
    const containerStyle = [styles.monthContainer, this.props.customStyle.monthContainer];
    return <View key={argMoment.month()} style={containerStyle}>{weekRows}</View>;
  }

  renderHeading() {
    const headings = [];
    for (let i = 0; i < 7; i++) {
      const j = (i + this.props.weekStart) % 7;
      headings.push(
        <Text
           key={i}
           style={j === 0 || j === 6 ?
                  [styles.weekendHeading, this.props.customStyle.weekendHeading] :
           [styles.dayHeading, this.props.customStyle.dayHeading]}
           >
          {this.props.dayHeadings[j]}
        </Text>
      );
    }

    return (
      <View style={[styles.calendarHeading, this.props.customStyle.calendarHeading]}>
        {headings}
      </View>
    );
  }

  renderTopBar() {
    let localizedMonth = this.props.monthNames[this.state.currentMonthMoment.month()];
    return this.props.showControls
      ? (
        <View style={[styles.calendarControls, this.props.customStyle.calendarControls]}>
          <TouchableOpacity
             style={[styles.controlButton, this.props.customStyle.controlButton]}
             onPress={this.onPrev}
             >
            <Text style={[styles.controlButtonText, this.props.customStyle.controlButtonText]}>
              {this.props.prevButtonText}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.title, this.props.customStyle.title]}>
            {localizedMonth} {this.state.currentMonthMoment.year()}
          </Text>
          <TouchableOpacity
             style={[styles.controlButton, this.props.customStyle.controlButton]}
             onPress={this.onNext}
             >
            <Text style={[styles.controlButtonText, this.props.customStyle.controlButtonText]}>
              {this.props.nextButtonText}
            </Text>
          </TouchableOpacity>
        </View>
      )
    : (
      <View style={[styles.calendarControls, this.props.customStyle.calendarControls]}>
        <Text style={[styles.title, this.props.customStyle.title]}>
          {this.state.currentMonthMoment.format(this.props.titleFormat)}
        </Text>
      </View>
    );
  }

  render() {
    const calendarDates = this.getMonthStack(this.state.currentMonthMoment);
    const eventDatesMap = this.prepareEventDates(this.props.eventDates, this.props.events);

    return (
      <View style={[styles.calendarContainer, this.props.customStyle.calendarContainer]}>
        {this.renderTopBar()}
        {this.renderHeading(this.props.titleFormat)}
        {this.props.scrollEnabled ?
          <ScrollView
               ref={calendar => this._calendar = calendar}
              horizontal
              scrollEnabled
              pagingEnabled
              removeClippedSubviews
              scrollEventThrottle={1000}
              showsHorizontalScrollIndicator={false}
              automaticallyAdjustContentInsets
              onMomentumScrollEnd={(event) => this.scrollEnded(event)}
              >
              {calendarDates.map((date) => this.renderCalendarView(this.props.calendarFormat, moment(date), eventDatesMap))}
         </ScrollView>
         :
         <View ref={calendar => this._calendar = calendar}>
             {calendarDates.map((date) => this.renderCalendarView(this.props.calendarFormat, moment(date), eventDatesMap))}
           </View>
         }
</View>
    );
  }
}
