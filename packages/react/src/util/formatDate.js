'use strict'

module.exports = {
  formatDateTime: date => {
    // returns format like: Sun, Jun 16, 2021, 08:42pm
    const dateOptions = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "numeric",
    }

    return new Date(date).toLocaleDateString("en", dateOptions)
  },
  formatDate: date => {
    // returns format like: Jun 16, 2021
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
}